# déjà — Update Log

Short, non-technical updates for Camryn. “Finished” means the code is ready for testing. A change is only live after a new App Store release.

## July 5, 2026 — Stability and privacy cleanup

**Status:** Finished in code. Not yet live in the App Store.

- Scrolling the feed should feel smoother and should no longer trigger refresh by accident.
- Pull-to-refresh now works only from the top of the feed.
- Tapping products and opening menus should feel more predictable.
- Filters update correctly, and the feed will no longer keep loading endlessly.
- Profile activity is now limited to the signed-in person.
- Clearing data and deleting an account now handle saved items, preferences, and styleboards more reliably.
- The admin screen is restricted to approved administrators.

**Before release**

- Test the main feed and account deletion on a real iPhone.
- Turn on the updated privacy protections in Firebase.
- Confirm approved admin access if the admin screen will be used.

## July 5, 2026 — Everyday experience improvements

**Status:** Finished in code. Not yet live in the App Store.

- Likes, dislikes, and saves can now be added and removed reliably.
- Saved products open normally, and recently viewed products stay available.
- Styleboards now support tapping, moving, resizing, and removing items on a phone.
- Photo search now rejects unsafe or oversized files and limits excessive use.
- Shopping links are checked before opening.
- Optional crash alerts can notify us when the app breaks without recording screens or email addresses.
- The privacy policy now matches how the app actually stores and processes information.

**Before release**

- Complete the [10-minute iPhone check](docs/iphone-release-checklist.md).
- Turn on crash alerts if a Sentry account will be used.
- Publish the updated app, server, and Firebase privacy settings together.
