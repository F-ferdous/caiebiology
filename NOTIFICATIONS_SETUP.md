# Push Notifications — Setup & Deploy

The notification system is built. Students/admins/assistants can install the app
to their home screen and turn on notifications; when the admin (or an assistant)
posts an **Announcement** targeted at everyone / a class / a batch, a Cloud
Function sends a Web Push notification to the matching students' devices — even
when the app is closed.

Three things only **you** can do (they need your Firebase account / billing).
Until they're done, everything else works except the actual push delivery — the
dashboard shows *"Push notifications aren't set up on this site yet."*

---

## 1. Enable the Blaze plan (required for Cloud Functions)

Cloud Functions can't deploy on the free Spark plan.

1. Open the Firebase console → project **caie-biology**.
2. Bottom-left, click **Upgrade** (or **⚙ → Usage and billing → Modify plan**).
3. Choose **Blaze (pay as you go)** and add a card.

Blaze has a large free tier — at your scale this is realistically **$0/month**,
but a card on file is mandatory. You can set a budget alert while you're there.

## 2. Create a Web Push (VAPID) key

1. Firebase console → **⚙ Project settings → Cloud Messaging** tab.
2. Under **Web configuration → Web Push certificates**, click **Generate key
   pair**.
3. Copy the key string it shows.

Add it to `.env.local` (same file as your other `NEXT_PUBLIC_FIREBASE_*` keys):

```
NEXT_PUBLIC_FIREBASE_VAPID_KEY=PASTE_THE_KEY_HERE
```

This key is public (it's safe in the client bundle, like the other NEXT_PUBLIC
values). The app must be **rebuilt** after adding it so it's baked into the
bundle.

## 3. Deploy

Install the function's dependencies once:

```bash
cd functions && npm install && cd ..
```

Then build the site and deploy hosting + the function together:

```bash
npm run build && firebase deploy --only hosting,functions
```

(You can also deploy them separately: `firebase deploy --only functions` and
`firebase deploy --only hosting`.)

The first functions deploy may ask to enable a couple of Google Cloud APIs
(Cloud Functions, Cloud Build, Artifact Registry, Eventarc) — accept.

---

## How it works

- **Install + enable** — The dashboard card (`InstallGuide`) detects the device
  (iPhone/iPad, Android, desktop) and shows step-by-step install instructions,
  then an **Enable notifications** button. On iPhone/iPad the app must be added
  to the Home Screen *first* (an iOS requirement for web push); the card says so.
- **Tokens** — When a user allows notifications, their FCM token is saved to the
  `PushTokens` collection with their role and (for students) class + batch. The
  token is refreshed silently on each login so class/batch reassignments are
  picked up.
- **Posting** — `Admin → Announcements` (also under the assistant panel) writes a
  doc to the `Announcements` collection with its target (all / class / batch).
- **Sending** — The `notifyOnAnnouncement` Cloud Function (`functions/index.js`)
  fires on each new `Announcements` doc, finds the matching student tokens, and
  sends a **data-only** FCM message. The service worker
  (`public/firebase-messaging-sw.js`) shows the notification; clicking it opens
  `/student/notices`. Dead tokens are pruned automatically.
- **In-app** — Students also see every notice in a new **Notices** tab, and a
  toast appears if a notice arrives while the app is open.

## Notes

- **Firestore rules:** your project is in open/test mode, so the client writes to
  `PushTokens` and reads `Announcements` without rule changes. The Cloud Function
  uses the Admin SDK and bypasses rules. If you ever lock rules down, allow
  students to create their own `PushTokens` doc and to read `Announcements`.
- **Supported browsers:** Chrome/Edge/Firefox (desktop + Android) and Safari
  16.4+ on iOS/iPadOS **when installed to the Home Screen**.
- **Testing:** after deploying, open the live site, install it, enable
  notifications, then post a test announcement from the admin panel — the device
  should receive it. Use "All students" for the simplest first test.
