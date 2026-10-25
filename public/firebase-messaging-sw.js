/* CAIE-BIOLOGY — Firebase Cloud Messaging service worker.
 *
 * The Firebase web config is PUBLIC (it's baked into the client bundle too), so
 * rather than committing it here we read it from this worker's own URL search
 * params — the client appends them when it registers the worker. See
 * src/lib/push.ts (registerMessagingSw).
 *
 * Notifications are sent data-only from the Cloud Function so this worker is the
 * single place that builds the visible notification — that avoids the duplicate
 * that a `notification` payload would also auto-display on the web. */

importScripts("https://www.gstatic.com/firebasejs/12.16.0/firebase-app-compat.js");
importScripts("https://www.gstatic.com/firebasejs/12.16.0/firebase-messaging-compat.js");

const params = new URL(self.location).searchParams;
const config = {
  apiKey: params.get("apiKey"),
  authDomain: params.get("authDomain"),
  projectId: params.get("projectId"),
  storageBucket: params.get("storageBucket"),
  messagingSenderId: params.get("messagingSenderId"),
  appId: params.get("appId"),
};

if (config.apiKey && config.projectId && config.messagingSenderId) {
  firebase.initializeApp(config);
  const messaging = firebase.messaging();

  messaging.onBackgroundMessage((payload) => {
    const data = payload.data || {};
    const title = data.title || "CAIE-BIOLOGY";
    self.registration.showNotification(title, {
      body: data.body || "",
      icon: "/icons/icon-192.png",
      badge: "/icons/icon-32.png",
      tag: data.tag || undefined,
      data: { url: data.url || "/" },
    });
  });
}

// Focus an open tab on the target path, or open a new one.
self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const target = (event.notification.data && event.notification.data.url) || "/";
  event.waitUntil(
    self.clients
      .matchAll({ type: "window", includeUncontrolled: true })
      .then((clientList) => {
        for (const client of clientList) {
          if (client.url.includes(target) && "focus" in client) return client.focus();
        }
        if (self.clients.openWindow) return self.clients.openWindow(target);
      })
  );
});
