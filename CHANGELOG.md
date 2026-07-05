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
