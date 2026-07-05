// Publishes a new Firestore ruleset and points the cloud.firestore release at it.
// Reversible: re-run with the previous ruleset content if needed.
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { GoogleAuth } from 'google-auth-library';

const __dirname = dirname(fileURLToPath(import.meta.url));
const keyPath = join(__dirname, 'firebase-admin-key.json');
const rulesPath = join(__dirname, '..', 'firestore.rules');
const sa = JSON.parse(readFileSync(keyPath, 'utf8'));
const PROJECT = sa.project_id;
const RULES = readFileSync(rulesPath, 'utf8');

const auth = new GoogleAuth({
  credentials: sa,
  scopes: ['https://www.googleapis.com/auth/firebase', 'https://www.googleapis.com/auth/cloud-platform'],
});
const client = await auth.getClient();

// 1. Read the current release so we can log what's being replaced.
const cur = await client.request({
  url: `https://firebaserules.googleapis.com/v1/projects/${PROJECT}/releases/cloud.firestore`,
});
console.log(`current ruleset: ${cur.data.rulesetName}`);

// 2. Create a new ruleset with the new source.
const newRuleset = await client.request({
  url: `https://firebaserules.googleapis.com/v1/projects/${PROJECT}/rulesets`,
  method: 'POST',
  data: {
    source: { files: [{ name: 'firestore.rules', content: RULES }] },
  },
});
console.log(`created ruleset: ${newRuleset.data.name}`);

// 3. Repoint the cloud.firestore release at the new ruleset.
await client.request({
  url: `https://firebaserules.googleapis.com/v1/projects/${PROJECT}/releases/cloud.firestore`,
  method: 'PATCH',
  data: {
    release: {
      name: `projects/${PROJECT}/releases/cloud.firestore`,
      rulesetName: newRuleset.data.name,
    },
  },
});
console.log('release updated — new rules are live.');

// 4. Verify by re-reading the release.
const verify = await client.request({
  url: `https://firebaserules.googleapis.com/v1/projects/${PROJECT}/releases/cloud.firestore`,
});
console.log(`verified ruleset: ${verify.data.rulesetName}`);
