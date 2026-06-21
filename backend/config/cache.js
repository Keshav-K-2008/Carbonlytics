/**
 * In-Memory TTL Cache Utility
 */
class SimpleCache {
  constructor() {
    this.cache = new Map();
  }

  /**
   * Set cache key with a Time-To-Live (TTL) in milliseconds
   * @param {string} key 
   * @param {any} value 
   * @param {number} ttlMs 
   */
  set(key, value, ttlMs) {
    const expiresAt = Date.now() + ttlMs;
    this.cache.set(key, { value, expiresAt });
  }

  /**
   * Get value by key, returns null/undefined if expired or missing
   * @param {string} key 
   * @returns {any}
   */
  get(key) {
    const entry = this.cache.get(key);
    if (!entry) return null;

    if (Date.now() > entry.expiresAt) {
      this.cache.delete(key);
      return null;
    }

    return entry.value;
  }

  /**
   * Clear all cached items
   */
  clear() {
    this.cache.clear();
  }
}

export const cache = new SimpleCache();
export default cache;
