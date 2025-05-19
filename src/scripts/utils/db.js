import CONFIG from '../config/config.js';

const DB_NAME = 'story-explorer-db';
const DB_VERSION = 1;
const STORE_NAME = 'stories';
const OFFLINE_STORE = 'offline-stories';

const openDB = () => {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open(DB_NAME, DB_VERSION);

        request.onerror = () => {
            reject(request.error);
        };

        request.onsuccess = () => {
            resolve(request.result);
        };

        request.onupgradeneeded = (event) => {
            const db = event.target.result;
            if (!db.objectStoreNames.contains(STORE_NAME)) {
                const storyStore = db.createObjectStore(STORE_NAME, { keyPath: 'id' });
                storyStore.createIndex('createdAt', 'createdAt', { unique: false });
            }
            if (!db.objectStoreNames.contains(OFFLINE_STORE)) {
                const offlineStore = db.createObjectStore(OFFLINE_STORE, { keyPath: 'id', autoIncrement: true });
                offlineStore.createIndex('timestamp', 'timestamp', { unique: false });
            }
        };
    });
};

const StoryDB = {
    async getStories() {
        try {
            const db = await openDB();
            return new Promise((resolve, reject) => {
                const transaction = db.transaction(STORE_NAME, 'readonly');
                const store = transaction.objectStore(STORE_NAME);
                const request = store.getAll();

                request.onsuccess = () => resolve(request.result);
                request.onerror = () => reject(request.error);
            });
        } catch (error) {
            console.error('Error getting stories:', error);
            return [];
        }
    },

    async saveStories(stories) {
        try {
            const db = await openDB();
            const transaction = db.transaction(STORE_NAME, 'readwrite');
            const store = transaction.objectStore(STORE_NAME);

            await Promise.all(stories.map(story => {
                return new Promise((resolve, reject) => {
                    const request = store.put({
                        ...story,
                        timestamp: new Date().getTime()
                    });
                    request.onsuccess = () => resolve();
                    request.onerror = () => reject(request.error);
                });
            }));

            return true;
        } catch (error) {
            console.error('Error saving stories:', error);
            return false;
        }
    },

    async saveOfflineStory(storyData) {
        try {
            const db = await openDB();
            const transaction = db.transaction(OFFLINE_STORE, 'readwrite');
            const store = transaction.objectStore(OFFLINE_STORE);

            return new Promise((resolve, reject) => {
                const request = store.add({
                    ...storyData,
                    timestamp: new Date().getTime(),
                    synced: false
                });
                request.onsuccess = () => resolve(true);
                request.onerror = () => reject(request.error);
            });
        } catch (error) {
            console.error('Error saving offline story:', error);
            return false;
        }
    },

    async getOfflineStories() {
        try {
            const db = await openDB();
            const transaction = db.transaction(OFFLINE_STORE, 'readonly');
            const store = transaction.objectStore(OFFLINE_STORE);
            
            return new Promise((resolve, reject) => {
                const request = store.getAll();
                request.onsuccess = () => resolve(request.result);
                request.onerror = () => reject(request.error);
            });
        } catch (error) {
            console.error('Error getting offline stories:', error);
            return [];
        }
    },

    async deleteStory(id) {
        try {
            const db = await openDB();
            const transaction = db.transaction(STORE_NAME, 'readwrite');
            const store = transaction.objectStore(STORE_NAME);

            return new Promise((resolve, reject) => {
                const request = store.delete(id);
                request.onsuccess = () => resolve(true);
                request.onerror = () => reject(request.error);
            });
        } catch (error) {
            console.error('Error deleting story:', error);
            return false;
        }
    },

    async clearOldStories(maxAge = 7 * 24 * 60 * 60 * 1000) { // 7 days
        try {
            const db = await openDB();
            const transaction = db.transaction(STORE_NAME, 'readwrite');
            const store = transaction.objectStore(STORE_NAME);
            const index = store.index('createdAt');
            const cutoffDate = new Date().getTime() - maxAge;

            const request = index.openCursor();
            
            return new Promise((resolve, reject) => {
                request.onsuccess = (event) => {
                    const cursor = event.target.result;
                    if (cursor) {
                        if (cursor.value.timestamp < cutoffDate) {
                            cursor.delete();
                        }
                        cursor.continue();
                    } else {
                        resolve(true);
                    }
                };
                request.onerror = () => reject(request.error);
            });
        } catch (error) {
            console.error('Error clearing old stories:', error);
            return false;
        }
    }
};

export default StoryDB;