const key = (userId) => `eb:words:${userId}`;
const load = (k, def) => { try { return JSON.parse(localStorage.getItem(k) || JSON.stringify(def)); } catch { return def; } };
const save = (k, v) => localStorage.setItem(k, JSON.stringify(v));

export const LocalWordsRepo = (userId) => ({
  list(limit = 100) {
    return load(key(userId), []).sort((a,b)=>b.createdAt-a.createdAt).slice(0, limit);
  },
  add({ term, translation, example }) {
    const all = load(key(userId), []);
    const item = { id: crypto.randomUUID(), userId, term, translation, example, createdAt: Date.now() };
    all.push(item); save(key(userId), all); return item;
  },
  update(id, patch) {
    const all = load(key(userId), []);
    const i = all.findIndex(x=>x.id===id); if (i<0) return null;
    all[i] = { ...all[i], ...patch }; save(key(userId), all); return all[i];
  },
  remove(id) {
    const all = load(key(userId), []).filter(x=>x.id!==id);
    save(key(userId), all);
  }
});
