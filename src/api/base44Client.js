// Firestore-backed client that replaces localStorage.
// ClothingItem & DupeSearch are global collections.
// Styleboard & UserPreference are per-user (stored under users/{uid}/...).

import { getDb, auth } from '@/lib/firebase';

let firestorePromise;
function loadFirestore() {
  if (!firestorePromise) {
    firestorePromise = Promise.all([
      import('firebase/firestore'),
      getDb(),
    ]).then(([fs, db]) => ({ fs, db }));
  }
  return firestorePromise;
}

function getUid() {
  return auth.currentUser?.uid || 'anonymous';
}

// ---------------------------------------------------------------------------
// Global collection (shared across all users) — used for ClothingItem, DupeSearch
// ---------------------------------------------------------------------------
function createGlobalStore(collectionName) {
  return {
    async list(_sortField = '-created_date', max = 100) {
      const { fs, db } = await loadFirestore();
      const q = fs.query(fs.collection(db, collectionName), fs.orderBy('created_date', 'desc'), fs.limit(max));
      const snap = await fs.getDocs(q);
      return snap.docs.map(d => ({ id: d.id, ...d.data() }));
    },

    async filter(queryObj) {
      const { fs, db } = await loadFirestore();
      const constraints = Object.entries(queryObj).map(([k, v]) => fs.where(k, '==', v));
      const q = fs.query(fs.collection(db, collectionName), ...constraints);
      const snap = await fs.getDocs(q);
      return snap.docs.map(d => ({ id: d.id, ...d.data() }));
    },

    async create(data) {
      const { fs, db } = await loadFirestore();
      const docRef = await fs.addDoc(fs.collection(db, collectionName), {
        ...data,
        created_date: new Date().toISOString(),
        created_by: getUid(),
      });
      return { id: docRef.id, ...data, created_date: new Date().toISOString() };
    },

    async update(id, data) {
      const { fs, db } = await loadFirestore();
      const ref = fs.doc(db, collectionName, id);
      await fs.updateDoc(ref, { ...data, updated_date: new Date().toISOString() });
      const snap = await fs.getDoc(ref);
      return { id: snap.id, ...snap.data() };
    },

    async delete(id) {
      const { fs, db } = await loadFirestore();
      await fs.deleteDoc(fs.doc(db, collectionName, id));
    },
  };
}

// ---------------------------------------------------------------------------
// Per-user collection (scoped to users/{uid}/...) — used for Styleboard, UserPreference
// ---------------------------------------------------------------------------
function createUserStore(subCollection) {
  return {
    async list(_sortField = '-created_date', max = 500) {
      const { fs, db } = await loadFirestore();
      const q = fs.query(
        fs.collection(db, 'users', getUid(), subCollection),
        fs.orderBy('created_date', 'desc'),
        fs.limit(max),
      );
      const snap = await fs.getDocs(q);
      return snap.docs.map(d => ({ id: d.id, ...d.data() }));
    },

    async filter(queryObj) {
      const { fs, db } = await loadFirestore();
      // For user stores, 'id' filter needs special handling
      if (queryObj.id) {
        const ref = fs.doc(db, 'users', getUid(), subCollection, queryObj.id);
        const snap = await fs.getDoc(ref);
        if (!snap.exists()) return [];
        return [{ id: snap.id, ...snap.data() }];
      }
      const constraints = Object.entries(queryObj).map(([k, v]) => fs.where(k, '==', v));
      const q = fs.query(fs.collection(db, 'users', getUid(), subCollection), ...constraints);
      const snap = await fs.getDocs(q);
      return snap.docs.map(d => ({ id: d.id, ...d.data() }));
    },

    async create(data) {
      const { fs, db } = await loadFirestore();
      const docRef = await fs.addDoc(fs.collection(db, 'users', getUid(), subCollection), {
        ...data,
        created_date: new Date().toISOString(),
        created_by: getUid(),
      });
      return { id: docRef.id, ...data, created_date: new Date().toISOString() };
    },

    async update(id, data) {
      const { fs, db } = await loadFirestore();
      const ref = fs.doc(db, 'users', getUid(), subCollection, id);
      await fs.updateDoc(ref, { ...data, updated_date: new Date().toISOString() });
      const snap = await fs.getDoc(ref);
      return { id: snap.id, ...snap.data() };
    },

    async delete(id) {
      const { fs, db } = await loadFirestore();
      await fs.deleteDoc(fs.doc(db, 'users', getUid(), subCollection, id));
    },
  };
}

export const base44 = {
  entities: {
    ClothingItem: createGlobalStore('clothing_items'),
    Styleboard: createUserStore('styleboards'),
    UserPreference: createUserStore('user_preferences'),
    DupeSearch: createGlobalStore('dupe_searches'),
  },
  auth: {
    async me() {
      const u = auth.currentUser;
      return u ? { email: u.email, full_name: u.displayName || '', role: 'user' } : null;
    },
    logout(redirectUrl) {
      if (redirectUrl) window.location.href = redirectUrl;
    },
    redirectToLogin() {},
  },
  integrations: {
    Core: {
      async UploadFile({ file }) {
        const url = URL.createObjectURL(file);
        return { file_url: url };
      },
      async InvokeLLM() {
        throw new Error('LLM integration not configured.');
      },
    },
  },
  functions: {
    async invoke(name) {
      throw new Error(`Serverless function "${name}" is not available.`);
    },
  },
};
