import StoryDB from '../utils/db.js';
import DBService from '../services/db-service.js';

class OfflineView {
    constructor() {
        this._container = document.querySelector('#mainContent');
    }

    async render() {
        return `
            <style>
                .offline-container {
                    max-width: 1200px;
                    margin: 2rem auto;
                    padding: 1rem;
                }

                .offline-header {
                    text-align: center;
                    margin-bottom: 2rem;
                    padding: 1rem;
                    background: #f8f9fa;
                    border-radius: 8px;
                    box-shadow: 0 2px 4px rgba(0,0,0,0.1);
                }

                .connection-status {
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    gap: 0.5rem;
                    color: #dc3545;
                }

                .content-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    margin-bottom: 2rem;
                }

                .view-toggle {
                    display: flex;
                    gap: 0.5rem;
                }

                .view-toggle button {
                    padding: 0.5rem 1rem;
                    border: 1px solid #dee2e6;
                    background: white;
                    border-radius: 4px;
                    cursor: pointer;
                }

                .view-toggle button.active {
                    background: #007bff;
                    color: white;
                    border-color: #007bff;
                }

                .story-list {
                    display: grid;
                    grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
                    gap: 1.5rem;
                }

                .story-card {
                    background: white;
                    border-radius: 8px;
                    overflow: hidden;
                    box-shadow: 0 2px 4px rgba(0,0,0,0.1);
                }

                .story-image {
                    width: 100%;
                    height: 200px;
                    object-fit: cover;
                }

                .story-details {
                    padding: 1rem;
                }

                .story-actions {
                    display: flex;
                    justify-content: space-between;
                    gap: 0.5rem;
                    padding: 0.5rem;
                }

                .toggle-favorite, .delete-story {
                    padding: 0.5rem 1rem;
                    border-radius: 4px;
                    cursor: pointer;
                    display: flex;
                    align-items: center;
                    gap: 0.5rem;
                    min-width: 44px;
                    min-height: 44px;
                }

                .toggle-favorite {
                    background: white;
                    border: 1px solid #dc3545;
                    color: #dc3545;
                }

                .delete-story {
                    background: #dc3545;
                    color: white;
                    border: none;
                }

                .empty-state {
                    text-align: center;
                    padding: 3rem;
                    background: #f8f9fa;
                    border-radius: 8px;
                    color: #666;
                    display: none;
                }

                .feedback-message {
                    position: fixed;
                    bottom: 20px;
                    right: 20px;
                    padding: 1rem;
                    border-radius: 4px;
                    color: white;
                    z-index: 1000;
                }

                .feedback-message.success {
                    background: #28a745;
                }

                .feedback-message.error {
                    background: #dc3545;
                }

                @media (max-width: 768px) {
                    .offline-container {
                        margin: 1rem;
                    }
                    .story-list {
                        grid-template-columns: 1fr;
                    }
                }
            </style>
            <div class="offline-container">
                <header class="offline-header">
                    <h2>Mode Offline</h2>
                    <p class="connection-status">
                        <i class="fas fa-wifi-slash"></i> 
                        Anda sedang dalam mode offline
                    </p>
                </header>

                <div class="offline-content">
                    <div class="content-header">
                        <h3>Cerita Favorit & Tersimpan</h3>
                        <div class="view-toggle">
                            <button id="showAll" class="active">Semua</button>
                            <button id="showFavorites">Favorit</button>
                        </div>
                    </div>
                    <div id="offlineStoryList" class="story-list"></div>
                    
                    <div id="emptyState" class="empty-state" style="display: none">
                        <i class="fas fa-inbox"></i>
                        <p>Tidak ada cerita tersimpan untuk mode offline</p>
                    </div>
                </div>
            </div>
        `;
    }

    _createStoryCard(story) {
        const isFavorite = story.isFavorite;
        return `
            <article class="story-card ${isFavorite ? 'favorite' : ''}" data-id="${story.id}">
                <img src="${story.photoUrl}" 
                    alt="Foto cerita ${story.name}"
                    class="story-image"
                    loading="lazy"
                    onerror="this.src='/images/placeholder.jpg'">
                <div class="story-details">
                    <h3>${story.name}</h3>
                    <p>${story.description}</p>
                    <time datetime="${story.createdAt}">
                        ${new Date(story.createdAt).toLocaleDateString('id-ID')}
                    </time>
                    <div class="story-actions">
                        <button class="toggle-favorite" data-id="${story.id}">
                            <i class="fas ${isFavorite ? 'fa-heart' : 'fa-heart-o'}"></i>
                            ${isFavorite ? 'Hapus dari Favorit' : 'Tambah ke Favorit'}
                        </button>
                        <button class="delete-story" data-id="${story.id}">
                            <i class="fas fa-trash"></i> Hapus
                        </button>
                    </div>
                </div>
            </article>
        `;
    }

    _initializeEventListeners() {
        // Existing delete story listeners
        document.querySelectorAll('.delete-story').forEach(button => {
            button.addEventListener('click', async (e) => {
                const id = e.target.closest('.delete-story').dataset.id;
                if (confirm('Apakah Anda yakin ingin menghapus cerita ini?')) {
                    await this._deleteStory(id);
                }
            });
        });

        // Add favorite toggle listeners
        document.querySelectorAll('.toggle-favorite').forEach(button => {
            button.addEventListener('click', async (e) => {
                const id = e.target.closest('.toggle-favorite').dataset.id;
                const story = await StoryDB.getStory(id);
                if (story.isFavorite) {
                    await DBService.removeFromFavorites(id);
                } else {
                    await DBService.addToFavorites(story);
                }
                await this._loadAllStories();
            });
        });

        // View toggle listeners
        const showAllBtn = document.getElementById('showAll');
        const showFavBtn = document.getElementById('showFavorites');

        showAllBtn?.addEventListener('click', async () => {
            showAllBtn.classList.add('active');
            showFavBtn.classList.remove('active');
            await this._loadAllStories();
        });

        showFavBtn?.addEventListener('click', async () => {
            showFavBtn.classList.add('active');
            showAllBtn.classList.remove('active');
            await this._loadFavoriteStories();
        });
    }

    async _loadFavoriteStories() {
        try {
            const favorites = await DBService.getFavorites();
            const container = document.getElementById('offlineStoryList');
            const emptyState = document.getElementById('emptyState');

            if (!favorites.length) {
                emptyState.style.display = 'flex';
                emptyState.querySelector('p').textContent = 'Tidak ada cerita favorit';
                container.innerHTML = '';
                return;
            }

            emptyState.style.display = 'none';
            container.innerHTML = favorites.map(story => this._createStoryCard(story)).join('');
            this._initializeEventListeners();
        } catch (error) {
            console.error('Error loading favorite stories:', error);
            this._showError('Gagal memuat cerita favorit');
        }
    }

    async afterRender() {
        await this._loadAllStories();
        this._initializeEventListeners();
        this._checkOnlineStatus();
    }

    async _loadAllStories() {
        try {
            const [offlineStories, favoriteStories] = await Promise.all([
                StoryDB.getStories(),
                DBService.getFavorites()
            ]);

            // Combine all stories and remove duplicates
            const allStories = [...offlineStories, ...favoriteStories].filter((story, index, self) =>
                index === self.findIndex((s) => s.id === story.id)
            );

            const container = document.getElementById('offlineStoryList');
            const emptyState = document.getElementById('emptyState');

            if (!allStories.length) {
                emptyState.style.display = 'flex';
                return;
            }

            container.innerHTML = allStories.map(story => this._createStoryCard(story)).join('');
        } catch (error) {
            console.error('Error loading stories:', error);
            this._showError('Gagal memuat cerita');
        }
    }

    async _deleteStory(id) {
        try {
            // Delete from both storages
            await Promise.all([
                StoryDB.deleteStory(id),
                DBService.removeFromFavorites(id)
            ]);
            await this._loadAllStories();
            this._showFeedback('Cerita berhasil dihapus');
        } catch (error) {
            console.error('Error deleting story:', error);
            this._showError('Gagal menghapus cerita');
        }
    }

    _checkOnlineStatus() {
        window.addEventListener('online', () => {
            this._showFeedback('Koneksi tersedia, mengalihkan ke mode online...');
            setTimeout(() => {
                window.location.hash = '#/home';
            }, 2000);
        });
    }

    _showFeedback(message, isError = false) {
        const feedback = document.createElement('div');
        feedback.className = `feedback-message ${isError ? 'error' : 'success'}`;
        feedback.textContent = message;
        this._container.appendChild(feedback);
        setTimeout(() => feedback.remove(), 3000);
    }

    _showError(message) {
        this._showFeedback(message, true);
    }

    async cleanup() {
        window.removeEventListener('online', this._checkOnlineStatus);
    }
}

export default OfflineView;