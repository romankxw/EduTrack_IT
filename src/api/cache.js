// src/api/cache.js
export class RequestCache {
  constructor({ ttl = 60_000, storage = null } = {}) {
    this.ttl = ttl;
    this.storage = storage;
    this.map = new Map();
  }

  static key(url, params = {}) {
    return `${url}?${new URLSearchParams(params).toString()}`;
  }

  get(key) {
    const entry = this.map.get(key)
      ?? (this.storage && JSON.parse(this.storage.getItem(key) ?? 'null'));
    if (!entry) return null;
    if (Date.now() - entry.time > this.ttl) {
      this.delete(key);
      return null;
    }
    return entry.value;
  }

  set(key, value) {
    const entry = { value, time: Date.now() };
    this.map.set(key, entry);
    try {
      this.storage?.setItem(key, JSON.stringify(entry));
    } catch {
      // Storage quota exceeded
    }
  }

  delete(key) {
    this.map.delete(key);
    try {
      this.storage?.removeItem(key);
    } catch {
      // Ignore
    }
  }

  clear() {
    this.map.clear();
  }
}

export const requestCache = new RequestCache({ ttl: 60_000 });
