import { openDB } from 'idb';

const DB_NAME = 'story-explorer-db';
const DB_VERSION = 1;

class DBService {
    static async initDB() {
        return openDB(DB_NAME, DB_VERSION, {
            upgrade(db) {
                if (!db.objectStoreNames.contains('stories')) {
                    const storyStore = db.createObjectStore('stories', { keyPath: 'id' });
                    storyStore.createIndex('timestamp', 'createdAt');
                }
            },
        });
    }

    static async saveStory(story) {
        const db = await this.initDB();
        await db.put('stories', story);
    }

    static async getStories() {
        const db = await this.initDB();
        return db.getAllFromIndex('stories', 'timestamp');
    }

    static async deleteStory(id) {
        const db = await this.initDB();
        await db.delete('stories', id);
    }
}

export default DBService;