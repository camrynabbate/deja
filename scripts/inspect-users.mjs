// Lists every Firebase Auth user and, for each, counts the docs under
// users/{uid}/user_preferences (split by like/save/dislike) and
// users/{uid}/styleboards. Helps answer "where did my saves go?"
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import admin from 'firebase-admin';

const __dirname = dirname(fileURLToPath(import.meta.url));
const keyPath = join(__dirname, 'firebase-admin-key.json');
const serviceAccount = JSON.parse(readFileSync(keyPath, 'utf8'));

admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });

const auth = admin.auth();
const db = admin.firestore();

async function countSubcollection(uid, sub) {
  const snap = await db.collection('users').doc(uid).collection(sub).count().get();
  return snap.data().count;
}

async function actionBreakdown(uid) {
  const snap = await db.collection('users').doc(uid).collection('user_preferences').get();
  const breakdown = { like: 0, save: 0, dislike: 0, other: 0 };
  for (const doc of snap.docs) {
    const a = doc.data().action;
    if (a in breakdown) breakdown[a] += 1;
    else breakdown.other += 1;
  }
  return { total: snap.size, ...breakdown };
}

const rows = [];
let nextPageToken;
do {
  const res = await auth.listUsers(1000, nextPageToken);
  for (const u of res.users) {
    rows.push({ uid: u.uid, email: u.email || '(no email)', created: u.metadata.creationTime });
  }
  nextPageToken = res.pageToken;
} while (nextPageToken);

console.log(`${rows.length} Firebase Auth users\n`);

const enriched = [];
for (const r of rows) {
  const prefs = await actionBreakdown(r.uid);
  const styleboards = await countSubcollection(r.uid, 'styleboards');
  enriched.push({ ...r, prefs, styleboards });
}

// Also check the 'anonymous' bucket in case anything ever leaked there.
const anonPrefs = await actionBreakdown('anonymous');
const anonStyleboards = await countSubcollection('anonymous', 'styleboards');
if (anonPrefs.total || anonStyleboards) {
  console.log(`*** users/anonymous bucket has data: ${anonPrefs.total} prefs (saves=${anonPrefs.save} likes=${anonPrefs.like} dislikes=${anonPrefs.dislike}), ${anonStyleboards} styleboards ***\n`);
}

enriched.sort((a, b) => (b.prefs.total + b.styleboards) - (a.prefs.total + a.styleboards));

console.log('email'.padEnd(40), 'uid'.padEnd(30), 'saves likes disl  sb  created');
console.log('-'.repeat(110));
for (const r of enriched) {
  console.log(
    r.email.padEnd(40),
    r.uid.slice(0, 28).padEnd(30),
    String(r.prefs.save).padStart(5),
    String(r.prefs.like).padStart(5),
    String(r.prefs.dislike).padStart(4),
    String(r.styleboards).padStart(4),
    r.created,
  );
}
