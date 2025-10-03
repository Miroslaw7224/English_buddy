// proste lokalne logowanie: profile + sesja w localStorage
const LS_PROFILES = 'eb:profiles';
const LS_SESSION  = 'eb:session';

const enc = new TextEncoder();
const buf2hex = (buf) => [...new Uint8Array(buf)].map(b=>b.toString(16).padStart(2,'0')).join('');
async function hash(password, salt) {
  const data = enc.encode(salt + '|' + password);
  const digest = await crypto.subtle.digest('SHA-256', data);
  return buf2hex(digest);
}
const load = (k, def) => { try { return JSON.parse(localStorage.getItem(k) || JSON.stringify(def)); } catch { return def; } };
const save = (k, v) => localStorage.setItem(k, JSON.stringify(v));

export const LocalAuthRepo = {
  async signUp(username, password) {
    const emailish = username.trim().toLowerCase();
    let profiles = load(LS_PROFILES, []);
    if (profiles.find(p => p.username === emailish)) throw new Error('Użytkownik już istnieje');
    const salt = crypto.randomUUID();
    const passwordHash = await hash(password, salt);
    const user = { id: crypto.randomUUID(), username: emailish, salt, passwordHash, createdAt: Date.now() };
    profiles.push(user); save(LS_PROFILES, profiles);
    save(LS_SESSION, { userId: user.id });
    return { id: user.id, username: user.username };
  },
  async signIn(username, password) {
    const emailish = username.trim().toLowerCase();
    const profiles = load(LS_PROFILES, []);
    const user = profiles.find(p => p.username === emailish);
    if (!user) return this.signUp(username, password); // pierwsze logowanie => rejestracja
    const check = await hash(password, user.salt);
    if (check !== user.passwordHash) throw new Error('Złe hasło');
    save(LS_SESSION, { userId: user.id });
    return { id: user.id, username: user.username };
  },
  async signOut() { localStorage.removeItem(LS_SESSION); },
  getCurrentUser() {
    const sess = load(LS_SESSION, null);
    if (!sess) return null;
    const profiles = load(LS_PROFILES, []);
    const u = profiles.find(p => p.id === sess.userId);
    return u ? { id: u.id, username: u.username } : null;
  },
  onAuthStateChanged(cb) {
    // lokalnie nie ma eventów — zwracamy unsubscribe no-op
    return () => {};
  }
};
