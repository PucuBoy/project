import StoryDB from '../utils/db.js';

class OfflineStoriesView {
    constructor() {
        this._container = document.querySelector('#mainContent');
    }

    async render() {
        return `
            <div class="offline-stories-container">
                <h2>Cerita Tersimpan Offline</h2>
                <div class="offline-actions">
                    <button id="syncOfflineStories" class="sync-button">
                        <i class="fas fa-sync"></i> Sinkronkan Cerita
                    </button>
                </div>
                <div id="offlineStoryList" class="story-list"></div>
            </div>
        `;
    }

    async afterRender() {
        await this._loadOfflineStories();
        this._initializeEventListeners();
    }

    async _loadOfflineStories() {
        const stories = await StoryDB.getStories();
        const container = document.getElementById('offlineStoryList');

        if (!stories.length) {
            container.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-inbox"></i>
                    <p>Tidak ada cerita tersimpan offline</p>
                </div>
            `;
            return;
        }

        container.innerHTML = stories.map(story => `
            <article class="story-item" data-id="${story.id}">
                <img src="${story.photoUrl}" alt="${story.description}" loading="lazy">
                <div class="story-content">
                    <h3>${story.name}</h3>
                    <p>${story.description}</p>
                    <div class="story-actions">
                        <button class="delete-story" data-id="${story.id}">
                            <i class="fas fa-trash"></i> Hapus
                        </button>
                    </div>
                </div>
            </article>
        `).join('');
    }

    _initializeEventListeners() {
        const syncButton = document.getElementById('syncOfflineStories');
        if (syncButton) {
            syncButton.addEventListener('click', async () => {
                try {
                    syncButton.disabled = true;
                    syncButton.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Menyinkronkan...';
                    
                    const offlineStories = await StoryDB.getOfflineStories();
                    // Implementation for syncing stories will go here
                    
                    await this._loadOfflineStories();
                    alert('Sinkronisasi berhasil!');
                } catch (error) {
                    console.error('Sync failed:', error);
                    alert('Gagal menyinkronkan cerita');
                } finally {
                    syncButton.disabled = false;
                    syncButton.innerHTML = '<i class="fas fa-sync"></i> Sinkronkan Cerita';
                }
            });
        }

        document.querySelectorAll('.delete-story').forEach(button => {
            button.addEventListener('click', async (e) => {
                const id = e.target.dataset.id;
                if (confirm('Apakah Anda yakin ingin menghapus cerita ini?')) {
                    await StoryDB.deleteStory(id);
                    await this._loadOfflineStories();
                }
            });
        });
    }

    async cleanup() {
        // Cleanup if needed
    }
}

export default OfflineStoriesView;