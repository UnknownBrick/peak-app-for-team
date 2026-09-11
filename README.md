# Standforge on Firebase + GitHub Pages

This is a static Firebase web app. It uses Firebase Authentication and Cloud Firestore directly from the browser, so it can be hosted on GitHub Pages without a paid server.

In Firebase Console, keep Email/Password enabled and add this Firestore rule while testing:

```text
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /standforge/board { allow read, write: if request.auth != null; }
  }
}
```

Upload `index.html` to the root of the GitHub Pages repository. Enable Pages from **Settings → Pages → Deploy from a branch → main → /(root)**.
