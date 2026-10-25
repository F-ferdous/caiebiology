"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { onForegroundMessage, type ForegroundMessage } from "@/lib/push";
import styles from "./PushToaster.module.css";

type Toast = ForegroundMessage & { id: number };

// Push messages that arrive while the app is open don't trigger the service
// worker's notification, so we surface them in-app as a dismissible toast.
export default function PushToaster() {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const router = useRouter();

  useEffect(() => {
    return onForegroundMessage((msg) => {
      const id = Date.now() + Math.random();
      setToasts((t) => [...t, { ...msg, id }]);
      setTimeout(() => {
        setToasts((t) => t.filter((x) => x.id !== id));
      }, 8000);
    });
  }, []);

  const dismiss = (id: number) => setToasts((t) => t.filter((x) => x.id !== id));

  if (toasts.length === 0) return null;

  return (
    <div className={styles.stack} role="region" aria-label="Notifications" aria-live="polite">
      {toasts.map((t) => (
        <div key={t.id} className={styles.toast}>
          <span className={styles.icon} aria-hidden="true">
            <i className="ti ti-bell-ringing" />
          </span>
          <div className={styles.text}>
            <div className={styles.title}>{t.title}</div>
            {t.body && <div className={styles.body}>{t.body}</div>}
            {t.url && (
              <button
                type="button"
                className={styles.link}
                onClick={() => {
                  dismiss(t.id);
                  router.push(t.url!);
                }}
              >
                View <i className="ti ti-arrow-right" aria-hidden="true" />
              </button>
            )}
          </div>
          <button
            type="button"
            className={styles.close}
            aria-label="Dismiss notification"
            onClick={() => dismiss(t.id)}
          >
            <i className="ti ti-x" aria-hidden="true" />
          </button>
        </div>
      ))}
    </div>
  );
}
