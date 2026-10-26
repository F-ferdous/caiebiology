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
const { onCall, HttpsError } = require("firebase-functions/v2/https");
const { defineSecret } = require("firebase-functions/params");
const logger = require("firebase-functions/logger");
const { initializeApp } = require("firebase-admin/app");
const { getFirestore, FieldValue } = require("firebase-admin/firestore");
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

/* ──────────────────────────────────────────────────────────────────────────
 * askTutor — the AI Biology tutor.
 *
 * Students have no Firebase Auth token (studentAuth.ts: the session is just a
 * Students doc id in localStorage), so this callable cannot trust request.auth.
 * Instead it re-reads the Students doc the client names and derives everything
 * (name, class → syllabus level) server-side. The LLM key never touches the
 * client; it lives in the GROQ_API_KEY secret and is read only here.
 *
 * Cost/abuse is bounded three ways, all enforced below, not in the browser:
 *   • the caller must be a real enrolled student (Students/{id} must exist)
 *   • a per-student daily message cap
 *   • a global daily cap that protects the whole Groq free-tier quota
 *
 * Provider-agnostic: Groq, OpenRouter, DeepSeek and Together are all
 * OpenAI-compatible, so switching is a one-line change to PROVIDER below plus
 * the matching secret. Deploy: firebase deploy --only functions
 * ────────────────────────────────────────────────────────────────────────── */

// The LLM key. Set once with:  firebase functions:secrets:set GROQ_API_KEY
const GROQ_API_KEY = defineSecret("GROQ_API_KEY");

// Swap these four lines (and the secret above) to change provider/model.
const PROVIDER = {
  endpoint: "https://api.groq.com/openai/v1/chat/completions",
  model: "llama-3.3-70b-versatile",
  // Caps the answer so a single reply can't devour the daily token budget.
  maxTokens: 500,
  temperature: 0.3,
};

// Guard rails — tune freely. The global cap is the safety net for the free
// tier's ~100k tokens/day: ~350 answered questions at this answer length.
const PER_STUDENT_DAILY = 15; // the ask is 10/student; 15 leaves a little slack
const GLOBAL_DAILY = 350;
const MAX_QUESTION_CHARS = 400; // ~60 words — rejects essays that waste tokens
const MAX_HISTORY_TURNS = 4; // recent context for follow-ups, kept small

/*
 * Syllabus grounding, keyed by level. Classes IX & X sit the O-Level syllabus;
 * XI & XII sit the A-Level syllabus.
 *
 * ⚠️ FILL THESE IN once the syllabus codes/outlines are provided. Keep `topics`
 * a COMPACT outline (a few hundred tokens), NOT the full syllabus PDF — it is
 * sent on every request and is the main driver of token usage. A topic/
 * sub-topic list is enough to keep answers on-syllabus.
 */
const SYLLABUS = {
  // Cambridge O Level Biology 5090 (for examination 2026–2028). Compact outline;
  // full learning outcomes are in the official syllabus PDF.
  O: {
    code: "5090",
    label: "Cambridge O Level Biology (9/IX & 10/X)",
    topics: [
      "1 Cells: cell structure and function; specialised cells, tissues and organs",
      "2 Classification: classification systems; features of organisms (five kingdoms, dichotomous keys)",
      "3 Movement into and out of cells: diffusion and osmosis; active transport",
      "4 Biological molecules: carbohydrates, proteins, lipids, water; food tests",
      "5 Enzymes: enzyme action; effects of temperature and pH",
      "6 Plant nutrition: photosynthesis; leaf structure; mineral nutrition",
      "7 Transport in flowering plants: uptake and transport of water and ions; transpiration and translocation",
      "8 Human nutrition: diet; digestive system; absorption and assimilation",
      "9 Human gas exchange",
      "10 Respiration: aerobic and anaerobic respiration",
      "11 Transport in humans: circulatory system; heart; blood vessels; blood",
      "12 Disease and immunity: disease and transmission; antibiotics; immunity",
      "13 Excretion: excretion; urinary system (kidney)",
      "14 Coordination and control: nervous system; sense organs; hormones; homeostasis; temperature and blood glucose control",
      "15 Coordination and response in plants: tropisms and plant hormones",
      "16 Development of organisms and continuity of life: nuclear division; asexual and sexual reproduction; reproduction in plants and in humans",
      "17 Inheritance: variation; DNA and chromosomes; inheritance (monohybrid); selection",
      "18 Biotechnology and genetic modification",
      "19 Relationships of organisms with one another and with the environment: energy flow; nutrient cycles; ecosystems and biodiversity; human effects on ecosystems; conservation",
    ].join("\n"),
  },
  // Cambridge International AS & A Level Biology 9700 (for examination 2028–2030).
  // Topics 1–11 are AS Level; 12–19 add the full A Level content.
  A: {
    code: "9700",
    label: "Cambridge International AS & A Level Biology (11/XI & 12/XII)",
    topics: [
      "— AS Level —",
      "1 Cell structure: the microscope in cell studies; cells as the basic units of living organisms (incl. prokaryotes and viruses)",
      "2 Biological molecules: testing for biological molecules; carbohydrates and lipids; proteins; water",
      "3 Enzymes: mode of action of enzymes; factors that affect enzyme action",
      "4 Cell membranes and transport: fluid mosaic membranes; movement into and out of cells",
      "5 The mitotic cell cycle: replication and division of nuclei and cells; chromosome behaviour in mitosis",
      "6 Nucleic acids and protein synthesis: structure of nucleic acids and DNA replication; protein synthesis",
      "7 Transport in plants: structure of transport tissues; transport mechanisms (water, ions, assimilates)",
      "8 Transport in mammals: the circulatory system; transport of oxygen and carbon dioxide; the heart",
      "9 Gas exchange: the gas exchange system",
      "10 Infectious diseases: infectious diseases; antibiotics",
      "11 Immunity: the immune system; antibodies and vaccination",
      "— A Level —",
      "12 Energy and respiration: energy; aerobic and anaerobic respiration",
      "13 Photosynthesis: photosynthesis as an energy transfer process; investigation of limiting factors",
      "14 Homeostasis: homeostasis in mammals (incl. kidney and blood glucose); homeostasis in plants (stomata)",
      "15 Control and coordination: control and coordination in mammals (nervous, muscles, hormones); in plants",
      "16 Inheritance: passage of information from parents to offspring (meiosis, genetic diagrams); roles of genes in determining phenotype; gene control",
      "17 Selection and evolution: variation; natural and artificial selection; evolution",
      "18 Classification, biodiversity and conservation: classification; biodiversity; conservation",
      "19 Genetic technology: principles of genetic technology; genetic technology applied to medicine; genetically modified organisms",
    ].join("\n"),
  },
};

// Classes IX, X → O Level; XI, XII → A Level. Roman or arabic, tolerant.
function levelForClass(studentClass) {
  const c = String(studentClass || "").trim().toUpperCase();
  if (c === "IX" || c === "X" || c === "9" || c === "10") return "O";
  if (c === "XI" || c === "XII" || c === "11" || c === "12") return "A";
  return null; // unknown class → no confident grounding
}

function buildSystemPrompt(syllabus, studentName) {
  return [
    `You are the CAIE-BIOLOGY AI tutor for ${studentName || "a student"}, a ${syllabus.label} student (syllabus ${syllabus.code}).`,
    "Your job is to clear up confusion about biology topics strictly within this syllabus.",
    "",
    "Rules:",
    "- Answer ONLY using concepts within the syllabus below. If a question is outside it, say so briefly and point them to the relevant in-syllabus topic instead.",
    "- Use Cambridge exam terminology and the depth expected at this level — no more, no less.",
    "- Explain the concept so they understand it; do NOT simply hand over answers to what looks like graded homework. Guide their reasoning.",
    "- Be concise and well-structured. Prefer short paragraphs and bullet points.",
    "- If the question is unclear, ask one focused clarifying question.",
    "",
    "Syllabus topics you cover:",
    syllabus.topics,
  ].join("\n");
}

// A UTC day key, e.g. "2026-10-26", for the rolling daily counters.
function todayKey() {
  return new Date().toISOString().slice(0, 10);
}

exports.askTutor = onCall({ secrets: [GROQ_API_KEY], maxInstances: 5 }, async (request) => {
  const data = request.data || {};
  const studentId = String(data.studentId || "").trim();
  const question = String(data.question || "").trim();
  const history = Array.isArray(data.history) ? data.history : [];

  if (!studentId) throw new HttpsError("unauthenticated", "Sign in as a student first.");
  if (!question) throw new HttpsError("invalid-argument", "Ask a question.");
  if (question.length > MAX_QUESTION_CHARS) {
    throw new HttpsError(
      "invalid-argument",
      `Please keep your question under ${MAX_QUESTION_CHARS} characters (about 60 words).`
    );
  }

  // 1 — the caller must be a real enrolled student; derive their level from it.
  const studentSnap = await db.collection("Students").doc(studentId).get();
  if (!studentSnap.exists) {
    throw new HttpsError("permission-denied", "Not a recognised student account.");
  }
  const student = studentSnap.data() || {};
  const level = levelForClass(student.class);
  if (!level) {
    throw new HttpsError(
      "failed-precondition",
      "Your class isn't set up for the tutor yet. Please contact your teacher."
    );
  }
  const syllabus = SYLLABUS[level];

  // 2 — rate limits (per-student + global), enforced atomically for the day.
  const day = todayKey();
  const studentUsageRef = db.collection("TutorUsage").doc(`${studentId}_${day}`);
  const globalUsageRef = db.collection("TutorUsage").doc(`_global_${day}`);

  await db.runTransaction(async (tx) => {
    const [su, gu] = await Promise.all([tx.get(studentUsageRef), tx.get(globalUsageRef)]);
    const sCount = (su.exists && su.get("count")) || 0;
    const gCount = (gu.exists && gu.get("count")) || 0;

    if (sCount >= PER_STUDENT_DAILY) {
      throw new HttpsError(
        "resource-exhausted",
        `You've reached today's limit of ${PER_STUDENT_DAILY} questions. Come back tomorrow!`
      );
    }
    if (gCount >= GLOBAL_DAILY) {
      throw new HttpsError(
        "resource-exhausted",
        "The tutor is busy right now — please try again later."
      );
    }

    tx.set(studentUsageRef, { studentId, day, count: sCount + 1 }, { merge: true });
    tx.set(globalUsageRef, { day, count: gCount + 1 }, { merge: true });
  });

  // 3 — build the message list: system grounding + trimmed history + question.
  const trimmedHistory = history
    .slice(-MAX_HISTORY_TURNS * 2)
    .filter((m) => m && (m.role === "user" || m.role === "assistant") && m.content)
    .map((m) => ({ role: m.role, content: String(m.content).slice(0, MAX_QUESTION_CHARS) }));

  const messages = [
    { role: "system", content: buildSystemPrompt(syllabus, student.name) },
    ...trimmedHistory,
    { role: "user", content: question },
  ];

  // 4 — call the LLM (OpenAI-compatible chat completions).
  let answer;
  try {
    const res = await fetch(PROVIDER.endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${GROQ_API_KEY.value()}`,
      },
      body: JSON.stringify({
        model: PROVIDER.model,
        messages,
        max_tokens: PROVIDER.maxTokens,
        temperature: PROVIDER.temperature,
      }),
    });
    if (!res.ok) {
      const detail = await res.text().catch(() => "");
      logger.error("LLM call failed", { status: res.status, detail: detail.slice(0, 500) });
      throw new HttpsError("unavailable", "The tutor couldn't answer just now. Please try again.");
    }
    const json = await res.json();
    answer = json?.choices?.[0]?.message?.content?.trim();
  } catch (err) {
    if (err instanceof HttpsError) throw err;
    logger.error("LLM request error", { message: err?.message });
    throw new HttpsError("unavailable", "The tutor couldn't answer just now. Please try again.");
  }
  if (!answer) throw new HttpsError("unavailable", "The tutor returned an empty answer. Please try again.");

  // 5 — persist the exchange so the chat survives reloads and teachers can
  // review what students ask. Written server-side so it can't be forged.
  const now = FieldValue.serverTimestamp();
  // Batched writes share one commit timestamp, so `order` (not createdAt) is
  // what the client sorts by — guarantees the question renders above its answer.
  const base = Date.now();
  const chatCol = db.collection("TutorChats").doc(studentId).collection("messages");
  const batch = db.batch();
  batch.set(chatCol.doc(), { role: "user", content: question, level, order: base, createdAt: now });
  batch.set(chatCol.doc(), { role: "assistant", content: answer, level, order: base + 1, createdAt: now });
  await batch.commit();

  return { answer, level };
});
