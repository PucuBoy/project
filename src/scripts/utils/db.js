import CONFIG from '../config/config.js';

const DB_NAME = 'story-explorer-db';
const DB_VERSION = 1;
const STORE_NAME = 'stories';

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
                db.createObjectStore(STORE_NAME, { keyPath: 'id' });
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
                    const request = store.put(story);
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
    }
};

export default StoryDB;