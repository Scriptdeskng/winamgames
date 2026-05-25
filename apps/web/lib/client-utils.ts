const isClient = typeof window !== "undefined";

export const localStore = {
  get: (key: string): string | null => {
    if (!isClient) return null;
    try {
      return window.localStorage.getItem(key);
    } catch {
      return null;
    }
  },

  set: (key: string, value: string): void => {
    if (!isClient) return;
    try {
      window.localStorage.setItem(key, value);
    } catch {
      // Storage quota exceeded or private browsing — fail silently
    }
  },

  remove: (key: string): void => {
    if (!isClient) return;
    try {
      window.localStorage.removeItem(key);
    } catch {
      // fail silently
    }
  },

  getJSON: <T>(key: string): T | null => {
    const raw = localStore.get(key);
    if (!raw) return null;
    try {
      return JSON.parse(raw) as T;
    } catch {
      return null;
    }
  },

  setJSON: <T>(key: string, value: T): void => {
    try {
      localStore.set(key, JSON.stringify(value));
    } catch {
      // fail silently
    }
  },
};