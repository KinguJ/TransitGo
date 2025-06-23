// Simple wrapper that mimics AsyncStorage with localStorage
export const AsyncStorage = {
  async getItem(key: string) {
    return Promise.resolve(localStorage.getItem(key));
  },
  async setItem(key: string, value: string) {
    localStorage.setItem(key, value);
    return Promise.resolve();
  },
  async removeItem(key: string) {
    localStorage.removeItem(key);
    return Promise.resolve();
  },
}; 