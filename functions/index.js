/**
 * CAIE-BIOLOGY Cloud Functions.
 *
 * `sendNotification` is the single push sender. Any feature (announcements,
 * resources, tests, mark uploads, …) creates a doc in the `Notifications`
 * collection — via src/lib/notify.ts `queueNotification()` — and this function
 * fans it out to the matching students' devices over FCM Web Push.
 *
 * Recipients are students AND their parents — a parent's PushToken carries the
 * child's studentId/class/batchId, so the same targeting reaches both.
 *
 * Targeting (field `target` on the doc):
 *   all     → every student/parent with notifications on
 *   class   → those whose `class` matches
 *   batch   → those in `batchId`
 *   student → the one `studentId` (student + their parents)
 *
 * Messages are sent data-only so the client service worker
 * (public/firebase-messaging-sw.js) builds the visible notification — avoids a
 * duplicate. Requires the Blaze plan. Deploy: firebase deploy --only functions
 */
const { onDocumentCreated } = require("firebase-functions/v2/firestore");
const { setGlobalOptions } = require("firebase-functions/v2");
const logger = require("firebase-functions/logger");
const { initializeApp } = require("firebase-admin/app");
const { getFirestore } = require("firebase-admin/firestore");
const { getMessaging } = require("firebase-admin/messaging");

initializeApp();
const db = getFirestore();

setGlobalOptions({ maxInstances: 10 });

// FCM accepts at most 500 tokens per multicast send.
const CHUNK = 500;

// Error codes that mean the token is dead and its doc should be removed.
const DEAD_TOKEN_CODES = new Set([
  "messaging/registration-token-not-registered",
  "messaging/invalid-registration-token",
  "messaging/invalid-argument",
]);

exports.sendNotification = onDocumentCreated("Notifications/{id}", async (event) => {
  const snap = event.data;
  if (!snap) return;

  const n = snap.data() || {};
  const title = (n.title || "CAIE-BIOLOGY").toString();
  const body = (n.body || "").toString();
  const target = n.target || "all";
  const type = (n.type || "announcement").toString();
  const url = (n.url || "/student/notices").toString();

  // Narrow a PushTokens query to the notification's audience. Equality-only, so
  // no composite index is required.
  const applyTarget = (base) => {
    if (target === "class") return base.where("class", "==", n.class);
    if (target === "batch") return base.where("batchId", "==", n.batchId);
    if (target === "student") return base.where("studentId", "==", n.studentId);
    return base; // "all"
  };

  if (target === "class" && !n.class) {
    return logger.warn("class notification with no class", { id: event.params.id });
  }
  if (target === "batch" && !n.batchId) {
    return logger.warn("batch notification with no batchId", { id: event.params.id });
  }
  if (target === "student" && !n.studentId) {
    return logger.warn("student notification with no studentId", { id: event.params.id });
  }
  if (!["all", "class", "batch", "student"].includes(target)) {
    return logger.warn("unknown notification target", { target });
  }

  // Both students and their parents receive the alert.
  const tokens = db.collection("PushTokens");
  const [studentDocs, parentDocs] = await Promise.all([
    applyTarget(tokens.where("role", "==", "student")).get(),
    applyTarget(tokens.where("role", "==", "parent")).get(),
  ]);
  const tokenDocs = [...studentDocs.docs, ...parentDocs.docs];
  if (tokenDocs.length === 0) {
    return logger.info("no matching push tokens", { id: event.params.id, target, type });
  }

  const message = {
    data: {
      title,
      body,
      url,
      type,
      tag: `${type}-${event.params.id}`,
    },
    webpush: {
      headers: { Urgency: "high", TTL: "86400" },
    },
  };

  let sent = 0;
  const deadRefs = [];

  for (let i = 0; i < tokenDocs.length; i += CHUNK) {
    const batch = tokenDocs.slice(i, i + CHUNK);
    const tokens = batch.map((d) => d.get("token")).filter(Boolean);
    if (tokens.length === 0) continue;

    const res = await getMessaging().sendEachForMulticast({ ...message, tokens });
    sent += res.successCount;

    res.responses.forEach((r, idx) => {
      if (!r.success && r.error && DEAD_TOKEN_CODES.has(r.error.code)) {
        deadRefs.push(batch[idx].ref);
      }
    });
  }

  // Prune tokens FCM reported as no longer valid.
  await Promise.all(deadRefs.map((ref) => ref.delete().catch(() => {})));

  logger.info("notification push sent", {
    id: event.params.id,
    type,
    target,
    matched: tokenDocs.length,
    sent,
    pruned: deadRefs.length,
  });
});
