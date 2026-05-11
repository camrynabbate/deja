# App Store Connect — App Privacy answers for déjà

Paste-ready answers for the App Privacy questionnaire at App Store Connect → Your App → App Privacy.

If you change what data the app collects, update this doc and the questionnaire together.

---

## 1. Does this app collect data?

**Yes.**

---

## 2. Data types collected

### Contact Info → Email Address
- **Collected for:** App Functionality (sign-in / account)
- **Linked to user:** Yes
- **Used for tracking:** No

### Contact Info → Name
- **Collected for:** App Functionality
- **Linked to user:** Yes
- **Used for tracking:** No
- *Only collected if the user sets a display name.*

### User Content → Other User Content
- **Collected for:** App Functionality
- **Linked to user:** Yes
- **Used for tracking:** No
- *Saved items, styleboards, taste preferences, dupe-search history.*

### Search History
- **Collected for:** App Functionality, Product Personalization
- **Linked to user:** Yes
- **Used for tracking:** No
- *Algolia search queries + DupeSearch records, used to personalize the feed.*

### Identifiers → User ID
- **Collected for:** App Functionality, Analytics
- **Linked to user:** Yes
- **Used for tracking:** No
- *Firebase UID + Algolia anonymous user token. First-party only.*

### Identifiers → Device ID
- **Collected for:** Analytics
- **Linked to user:** Yes
- **Used for tracking:** No
- *Firebase Analytics IDFV (per-app, not cross-app). IDFA is NOT collected.*

### Usage Data → Product Interaction
- **Collected for:** Analytics, Product Personalization, App Functionality
- **Linked to user:** Yes
- **Used for tracking:** No
- *Likes, saves, dislikes, page views — feeds the recommendation model.*

### Diagnostics → Crash Data
- **Collected for:** App Functionality, Analytics
- **Linked to user:** No
- **Used for tracking:** No
- *Only if VITE_SENTRY_DSN is set in the deployed build. Skip this row if Sentry is not enabled yet.*

### Diagnostics → Performance Data
- **Collected for:** Analytics
- **Linked to user:** No
- **Used for tracking:** No
- *Web Vitals (LCP, INP, CLS, FCP, TTFB) via Sentry. Skip if Sentry is not enabled yet.*

### Browsing History → Other Data Types: "Affiliate click data"
- **Collected for:** Third-Party Advertising
- **Linked to user:** No
- **Used for tracking:** YES ← this is what triggers the ATT requirement
- *Skimlinks rewrites outbound product links so brands can attribute the click. Only loaded after the user grants ATT permission.*

---

## 3. Third-party services and what they collect

| Service | What they get | Why |
|---|---|---|
| Firebase Auth | Email, name, hashed password | Sign-in |
| Firebase Firestore | All user content (preferences, styleboards, dupes, searches) | App data store |
| Firebase Analytics | IDFV, session/usage events | App analytics |
| Algolia | Search queries, click events, anonymous user token | Product search |
| Skimlinks | Outbound URL clicks | Affiliate attribution (third-party ad / tracking) |
| Sentry *(when DSN is set)* | Crash stacks, web vitals, route URLs | Error monitoring |

---

## 4. App Tracking Transparency

**Required:** Yes — because Skimlinks is declared as Used for Tracking.

**Prompt copy** (already in `Info.plist`):
> "Allowing tracking lets déjà credit the brands and creators when you shop the items you discover."

**Behavior:**
- ATT prompt fires once after sign-in (in `src/lib/tracking.js`).
- Authorized → Skimlinks script loads.
- Denied / Restricted / Not Determined → Skimlinks does not load. Outbound product links open the raw URL.

---

## 5. Privacy Policy URL

- **URL to provide:** `https://bedeja.com/privacy`
- *Already live as a public route via `src/pages/Privacy.jsx`.*

---

## 6. Quick rules to remember if the app changes

- Any new third-party SDK that uses any device identifier → re-evaluate "Used for tracking".
- Adding IAP or Stripe for **digital** goods → declare Purchases. (Physical goods like clothing — no IAP needed, no extra disclosure.)
- Enabling Firebase Analytics IDFA collection → flips Device ID to "Used for tracking: Yes" and you'd need to gate it behind ATT too.
- Adding push notifications → declare under Diagnostics or User Content depending on payload contents.
