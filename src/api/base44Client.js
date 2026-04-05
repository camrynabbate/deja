// Local storage-backed client that replaces the Base44 SDK.
// Data persists in the browser's localStorage.

function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}

function createEntityStore(name) {
  const key = `vera_${name}`;

  function getAll() {
    try {
      return JSON.parse(localStorage.getItem(key) || '[]');
    } catch {
      return [];
    }
  }

  function saveAll(items) {
    localStorage.setItem(key, JSON.stringify(items));
  }

  return {
    async list(sortField = '-created_date', limit = 100) {
      let items = getAll();
      const desc = sortField.startsWith('-');
      const field = desc ? sortField.slice(1) : sortField;
      items.sort((a, b) => {
        const av = a[field] || '';
        const bv = b[field] || '';
        return desc ? (bv > av ? 1 : -1) : (av > bv ? 1 : -1);
      });
      return items.slice(0, limit);
    },

    async filter(query) {
      const items = getAll();
      return items.filter(item =>
        Object.entries(query).every(([k, v]) => String(item[k]) === String(v))
      );
    },

    async create(data) {
      const items = getAll();
      const newItem = {
        ...data,
        id: generateId(),
        created_date: new Date().toISOString(),
        created_by: 'local_user',
      };
      items.unshift(newItem);
      saveAll(items);
      return newItem;
    },

    async update(id, data) {
      const items = getAll();
      const index = items.findIndex(item => String(item.id) === String(id));
      if (index === -1) throw new Error(`${name} with id ${id} not found`);
      items[index] = { ...items[index], ...data, updated_date: new Date().toISOString() };
      saveAll(items);
      return items[index];
    },

    async delete(id) {
      const items = getAll();
      saveAll(items.filter(item => String(item.id) !== String(id)));
    },
  };
}

const LOCAL_USER = {
  email: 'you@vera.local',
  full_name: 'You',
  role: 'admin',
};

export const base44 = {
  entities: {
    ClothingItem: createEntityStore('clothing_items'),
    Styleboard: createEntityStore('styleboards'),
    UserPreference: createEntityStore('user_preferences'),
    DupeSearch: createEntityStore('dupe_searches'),
  },
  auth: {
    async me() {
      return LOCAL_USER;
    },
    logout(redirectUrl) {
      // Clear all local data if desired
      if (redirectUrl) {
        window.location.href = redirectUrl;
      }
    },
    redirectToLogin(redirectUrl) {
      // No-op locally — user is always logged in
    },
  },
  integrations: {
    Core: {
      async UploadFile({ file }) {
        // Return a local blob URL for the uploaded file
        const url = URL.createObjectURL(file);
        return { file_url: url };
      },
      async InvokeLLM({ prompt, response_json_schema }) {
        // Return mock data — can be replaced with a real API call later
        throw new Error('LLM integration not configured. Use the Admin page to load seed data instead.');
      },
    },
  },
  functions: {
    async invoke(name, params) {
      throw new Error(`Serverless function "${name}" is not available locally.`);
    },
  },
};
