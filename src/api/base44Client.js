// Firestore-backed client that replaces localStorage.
// ClothingItem & DupeSearch are global collections.
// Styleboard & UserPreference are per-user (stored under users/{uid}/...).

import { db, auth } from '@/lib/firebase';
import {
  collection,
  doc,
  getDocs,
  getDoc,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  orderBy,
  limit as fbLimit,
  where,
  serverTimestamp,
} from 'firebase/firestore';

function getUid() {
  return auth.currentUser?.uid || 'anonymous';
}

// ---------------------------------------------------------------------------
// Global collection (shared across all users) — used for ClothingItem, DupeSearch
// ---------------------------------------------------------------------------
function createGlobalStore(collectionName) {
  const col = () => collection(db, collectionName);

  return {
    async list(_sortField = '-created_date', max = 100) {
      const q = query(col(), orderBy('created_date', 'desc'), fbLimit(max));
      const snap = await getDocs(q);
      return snap.docs.map(d => ({ id: d.id, ...d.data() }));
    },

    async filter(queryObj) {
      const constraints = Object.entries(queryObj).map(([k, v]) => where(k, '==', v));
      const q = query(col(), ...constraints);
      const snap = await getDocs(q);
      return snap.docs.map(d => ({ id: d.id, ...d.data() }));
    },

    async create(data) {
      const docRef = await addDoc(col(), {
        ...data,
        created_date: new Date().toISOString(),
        created_by: getUid(),
      });
      return { id: docRef.id, ...data, created_date: new Date().toISOString() };
    },

    async update(id, data) {
      const ref = doc(db, collectionName, id);
      await updateDoc(ref, { ...data, updated_date: new Date().toISOString() });
      const snap = await getDoc(ref);
      return { id: snap.id, ...snap.data() };
    },

    async delete(id) {
      await deleteDoc(doc(db, collectionName, id));
    },
  };
}

// ---------------------------------------------------------------------------
// Per-user collection (scoped to users/{uid}/...) — used for Styleboard, UserPreference
// ---------------------------------------------------------------------------
function createUserStore(subCollection) {
  const col = () => collection(db, 'users', getUid(), subCollection);

  return {
    async list(_sortField = '-created_date', max = 500) {
      const q = query(col(), orderBy('created_date', 'desc'), fbLimit(max));
      const snap = await getDocs(q);
      return snap.docs.map(d => ({ id: d.id, ...d.data() }));
    },

    async filter(queryObj) {
      // For user stores, 'id' filter needs special handling
      if (queryObj.id) {
        const ref = doc(db, 'users', getUid(), subCollection, queryObj.id);
        const snap = await getDoc(ref);
        if (!snap.exists()) return [];
        return [{ id: snap.id, ...snap.data() }];
      }
      const constraints = Object.entries(queryObj).map(([k, v]) => where(k, '==', v));
      const q = query(col(), ...constraints);
      const snap = await getDocs(q);
      return snap.docs.map(d => ({ id: d.id, ...d.data() }));
    },

    async create(data) {
      const docRef = await addDoc(col(), {
        ...data,
        created_date: new Date().toISOString(),
        created_by: getUid(),
      });
      return { id: docRef.id, ...data, created_date: new Date().toISOString() };
    },

    async update(id, data) {
      const ref = doc(db, 'users', getUid(), subCollection, id);
      await updateDoc(ref, { ...data, updated_date: new Date().toISOString() });
      const snap = await getDoc(ref);
      return { id: snap.id, ...snap.data() };
    },

    async delete(id) {
      await deleteDoc(doc(db, 'users', getUid(), subCollection, id));
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
