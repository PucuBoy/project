import StoryDB from '../utils/db.js';

class OfflineView {
    constructor() {
        this._container = document.querySelector('#mainContent');
    }

    async render() {
        return `
            <div class="offline-container">
                <header class="offline-header">
                    <h2>Mode Offline</h2>
                    <p class="connection-status">
                        <i class="fas fa-wifi-slash"></i> 
                        Anda sedang dalam mode offline
                    </p>
                </header>

                <div class="offline-content">
                    <div id="offlineStoryList" class="story-list"></div>
                    <div id="emptyState" class="empty-state" style="display: none">
                        <i class="fas fa-inbox"></i>
                        <p>Tidak ada cerita tersimpan untuk mode offline</p>
                    </div>
                </div>

                <div class="offline-info">
                    <h3>Informasi Mode Offline</h3>
                    <ul>
                        <li>Cerita yang tersimpan dapat diakses tanpa koneksi internet</li>
                        <li>Perubahan akan disinkronkan saat kembali online</li>
                        <li>Fitur tambah cerita tetap tersedia dalam mode offline</li>
                    </ul>
                </div>
            </div>
        `;
    }

    async afterRender() {
        await this._loadOfflineStories();
        this._initializeEventListeners();
        this._checkOnlineStatus();
    }

    async _loadOfflineStories() {
        try {
            const stories = await StoryDB.getStories();
            const container = document.getElementById('offlineStoryList');
            const emptyState = document.getElementById('emptyState');

            if (!stories.length) {
                emptyState.style.display = 'flex';
                return;
            }

            container.innerHTML = stories.map(story => this._createStoryCard(story)).join('');
        } catch (error) {
            console.error('Error loading offline stories:', error);
            this._showError('Gagal memuat cerita offline');
        }
    }

    _createStoryCard(story) {
        return `
            <article class="story-card" data-id="${story.id}">
                <img src="${story.photoUrl}" 
                    alt="Foto cerita ${story.name}"
                    class="story-image"
                    loading="lazy">
                <div class="story-details">
                    <h3>${story.name}</h3>
                    <p>${story.description}</p>
                    <time datetime="${story.createdAt}">
                        ${new Date(story.createdAt).toLocaleDateString('id-ID')}
                    </time>
                    <div class="story-actions">
                        <button class="delete-story" data-id="${story.id}">
                            <i class="fas fa-trash"></i> Hapus
                        </button>
                    </div>
                </div>
            </article>
        `;
    }

    _initializeEventListeners() {
        document.querySelectorAll('.delete-story').forEach(button => {
            button.addEventListener('click', async (e) => {
                const id = e.target.dataset.id;
                if (confirm('Apakah Anda yakin ingin menghapus cerita ini?')) {
                    await this._deleteStory(id);
                }
            });
        });
    }

    async _deleteStory(id) {
        try {
            await StoryDB.deleteStory(id);
            await this._loadOfflineStories();
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