import { openDB } from 'idb';
import StoryDB from '../utils/db.js';  // Add this import

const DB_NAME = 'story-explorer-db';
const DB_VERSION = 2;

class DBService {
    static async initDB() {
        if (!('indexedDB' in window)) {
            console.error('IndexedDB not supported');
            return null;
        }

        try {
            return await openDB(DB_NAME, DB_VERSION, {
                upgrade(db, oldVersion, newVersion) {
                    if (!db.objectStoreNames.contains('stories')) {
                        const storyStore = db.createObjectStore('stories', { keyPath: 'id' });
                        storyStore.createIndex('timestamp', 'createdAt');
                    }
                    
                    if (!db.objectStoreNames.contains('favorites')) {
                        const favoriteStore = db.createObjectStore('favorites', { keyPath: 'id' });
                        favoriteStore.createIndex('timestamp', 'createdAt');
                    }
                },
            });
        } catch (error) {
            console.error('Error initializing database:', error);
            return null;
        }
    }

    // Existing methods for offline stories
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

    // New methods for favorite stories
    static async addToFavorites(story) {
        const db = await this.initDB();
        story.isFavorite = true;  // Add favorite flag
        await db.put('favorites', story);
        await this.saveStory(story);  // Use the class's own method
    }

    static async removeFromFavorites(id) {
        const db = await this.initDB();
        await db.delete('favorites', id);
        const story = await this.getStory(id);
        if (story) {
            story.isFavorite = false;
            await this.saveStory(story);
        }
    }

    // Add this helper method
    static async getStory(id) {
        const db = await this.initDB();
        return db.get('stories', id);
    }

    static async getFavorites() {
        const db = await this.initDB();
        return db.getAllFromIndex('favorites', 'timestamp');
    }

    static async isFavorite(id) {
        const db = await this.initDB();
        const story = await db.get('favorites', id);
        return !!story;
    }
}

export default DBService;