"use client";

import { useEffect, useMemo, useState } from "react";
import {
  enablePush,
  isPushSupported,
  isRunningStandalone,
  notificationPermission,
  refreshPushToken,
  type PushOwner,
} from "@/lib/push";
import { VAPID_KEY } from "@/lib/firebase";
import styles from "./InstallGuide.module.css";

// The browser fires this before showing its own install prompt; we capture it
// so an in-app "Install app" button can trigger it on Android/desktop Chrome.
type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

type Platform = "ios" | "android" | "desktop";

function detectPlatform(): Platform {
  if (typeof navigator === "undefined") return "desktop";
  const ua = navigator.userAgent;
  const iOS =
    /iPad|iPhone|iPod/.test(ua) ||
    // iPadOS 13+ reports as a Mac but has a touch screen.
    (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
  if (iOS) return "ios";
  if (/Android/.test(ua)) return "android";
  return "desktop";
}

type PermState = NotificationPermission | "unsupported";

export default function InstallGuide({ owner }: { owner: PushOwner }) {
  const [mounted, setMounted] = useState(false);
  const [platform, setPlatform] = useState<Platform>("desktop");
  const [standalone, setStandalone] = useState(false);
  const [perm, setPerm] = useState<PermState>("unsupported");
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState<{ kind: "ok" | "err"; text: string } | null>(null);
  // null = follow the default (collapsed); once the user clicks the header we
  // honour their explicit choice instead.
  const [manualOpen, setManualOpen] = useState<boolean | null>(null);

  useEffect(() => {
    setMounted(true);
    setPlatform(detectPlatform());
    setStandalone(isRunningStandalone());
    setPerm(notificationPermission());

    const onPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };
    const onInstalled = () => setDeferredPrompt(null);
    window.addEventListener("beforeinstallprompt", onPrompt);
    window.addEventListener("appinstalled", onInstalled);
    return () => {
      window.removeEventListener("beforeinstallprompt", onPrompt);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, []);

  // Keep this device's token (and its class/batch metadata) fresh on every load
  // when the user has already allowed notifications — no prompt shown.
  useEffect(() => {
    if (perm === "granted") void refreshPushToken(owner);
    // owner fields are primitives; re-run when they change (e.g. batch reassigned)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [perm, owner.role, owner.studentId, owner.class, owner.batchId]);

  const supported = mounted && isPushSupported();
  const needsInstallFirst = platform === "ios" && !standalone;

  // Collapsed by default — the user expands it from the header when they want
  // the install / notification steps.
  const open = manualOpen ?? false;

  const handleEnable = async () => {
    setBusy(true);
    setNotice(null);
    const res = await enablePush(owner);
    setPerm(notificationPermission());
    if (res.ok) {
      setNotice({ kind: "ok", text: "Notifications are on for this device." });
    } else {
      const messages: Record<string, string> = {
        unsupported: "This browser can't receive push notifications.",
        "missing-vapid": "Notifications aren't configured yet — ask the admin to add the VAPID key.",
        denied:
          "Notifications are blocked. Enable them in your browser/site settings, then try again.",
        default: "Permission wasn't granted. Tap again and choose Allow.",
        error: "Couldn't turn on notifications. Please try again.",
      };
      setNotice({ kind: "err", text: messages[res.reason] ?? "Couldn't turn on notifications." });
    }
    setBusy(false);
  };

  const handleInstall = async () => {
    if (!deferredPrompt) return;
    await deferredPrompt.prompt();
    const choice = await deferredPrompt.userChoice;
    if (choice.outcome === "accepted") setDeferredPrompt(null);
  };

  const steps = useMemo(() => installSteps(platform), [platform]);

  // Avoid hydration mismatch — the card is client-only (platform/permission).
  if (!mounted) return null;

  const notifConfigured = Boolean(VAPID_KEY);
  const subscribed = perm === "granted";

  return (
    <section className={styles.card} aria-labelledby="install-guide-title">
      <button
        type="button"
        className={styles.head}
        onClick={() => setManualOpen(!open)}
        aria-expanded={open}
      >
        <span className={styles.headIcon} aria-hidden="true">
          <i className="ti ti-device-mobile-down" />
        </span>
        <span className={styles.headText}>
          <span id="install-guide-title" className={styles.title}>
            Install the app &amp; turn on notifications
          </span>
          <span className={styles.subtitle}>
            {subscribed
              ? "Notifications are on for this device."
              : standalone || platform === "desktop"
                ? "Get notified the moment a new notice is posted."
                : "Add CAIE-BIOLOGY to your home screen to get notices."}
          </span>
        </span>
        <span className={styles.statusDot} data-on={subscribed} aria-hidden="true" />
        <i
          className={`ti ti-chevron-${open ? "up" : "down"} ${styles.chevron}`}
          aria-hidden="true"
        />
      </button>

      {open && (
        <div className={styles.body}>
          {/* ---- Install steps (hidden once installed) ---- */}
          {!standalone && (
            <div className={styles.block}>
              <h3 className={styles.blockTitle}>
                <i className="ti ti-download" aria-hidden="true" />
                {platform === "ios"
                  ? "Add to Home Screen (iPhone / iPad)"
                  : platform === "android"
                    ? "Install on Android"
                    : "Install on your computer"}
              </h3>
              <ol className={styles.steps}>
                {steps.map((s, i) => (
                  <li key={i} className={styles.step}>
                    <span className={styles.stepNum}>{i + 1}</span>
                    <span className={styles.stepText}>{s}</span>
                  </li>
                ))}
              </ol>
              {deferredPrompt && (
                <button type="button" className="btn btn-primary" onClick={handleInstall}>
                  <i className="ti ti-download" aria-hidden="true" /> Install app
                </button>
              )}
            </div>
          )}

          {/* ---- Notifications ---- */}
          <div className={styles.block}>
            <h3 className={styles.blockTitle}>
              <i className="ti ti-bell" aria-hidden="true" /> Allow notifications
            </h3>

            {!supported ? (
              <p className={styles.muted}>
                This browser doesn&apos;t support push notifications. Try Chrome, Edge, Firefox, or
                Safari 16.4+.
              </p>
            ) : !notifConfigured ? (
              <p className={styles.muted}>
                Push notifications aren&apos;t set up on this site yet.
              </p>
            ) : needsInstallFirst ? (
              <p className={styles.muted}>
                On iPhone/iPad, finish the steps above first. Once you open CAIE-BIOLOGY from your
                home screen, come back here and tap <strong>Enable notifications</strong>.
              </p>
            ) : subscribed ? (
              <div className={`${styles.banner} ${styles.bannerOk}`}>
                <i className="ti ti-circle-check" aria-hidden="true" />
                <span>You&apos;re all set — this device will receive notices.</span>
              </div>
            ) : perm === "denied" ? (
              <p className={styles.muted}>
                Notifications are blocked for this site. Open your browser&apos;s site settings,
                allow notifications for CAIE-BIOLOGY, then reload and try again.
              </p>
            ) : (
              <>
                <p className={styles.muted}>
                  Turn on notifications so you&apos;re alerted when your teacher posts a notice for
                  your class or batch.
                </p>
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={handleEnable}
                  disabled={busy}
                >
                  <i className="ti ti-bell-ringing" aria-hidden="true" />
                  {busy ? "Enabling…" : "Enable notifications"}
                </button>
              </>
            )}

            {notice && (
              <div
                className={`${styles.banner} ${notice.kind === "ok" ? styles.bannerOk : styles.bannerErr}`}
                role={notice.kind === "err" ? "alert" : "status"}
              >
                <i
                  className={`ti ${notice.kind === "ok" ? "ti-circle-check" : "ti-alert-circle"}`}
                  aria-hidden="true"
                />
                <span>{notice.text}</span>
              </div>
            )}
          </div>
        </div>
      )}
    </section>
  );
}

function installSteps(platform: Platform): string[] {
  switch (platform) {
    case "ios":
      return [
        "In Safari, tap the Share button (the square with an upward arrow) in the toolbar.",
        "Scroll down and tap “Add to Home Screen”.",
        "Tap “Add” in the top-right corner.",
        "Open CAIE-BIOLOGY from the new home-screen icon, then enable notifications below.",
      ];
    case "android":
      return [
        "Tap “Install app” below, or open Chrome’s ⋮ menu and choose “Install app” / “Add to Home screen”.",
        "Confirm by tapping “Install”.",
        "Open CAIE-BIOLOGY from your home screen.",
        "Tap “Enable notifications” below and choose Allow.",
      ];
    default:
      return [
        "Click “Install app” below, or the install icon (⊕) at the right of the address bar.",
        "Confirm “Install” in the dialog.",
        "Then click “Enable notifications” below and choose Allow.",
      ];
  }
}
