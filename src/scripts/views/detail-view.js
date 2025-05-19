import ApiService from '../services/api-service.js';
import UrlParser from '../routes/url-parser.js';
import Auth from '../utils/auth.js';
import StoryDB from '../utils/db.js';

class DetailView {
    constructor() {
        this._container = document.querySelector('#mainContent');
        this._story = null;
    }

    async render() {
        return `
            <div class="detail-container">
                <div id="loadingIndicator" class="loading-indicator">
                    <i class="fas fa-spinner fa-spin"></i>
                    Memuat cerita...
                </div>
                <div id="storyDetail" class="story-detail"></div>
            </div>
        `;
    }

    async afterRender() {
        const url = UrlParser.parseActiveUrlWithoutCombiner();
        await this._fetchStoryDetail(url.id);
    }

    async _fetchStoryDetail(id) {
        try {
            const token = Auth.getToken();
            const response = await ApiService.getStoryDetail(token, id);

            if (response.error) {
                throw new Error(response.message);
            }

            this._story = response.story;
            await this._renderStoryDetail();
            await this._saveToOffline();
        } catch (error) {
            console.error('Error fetching story:', error);
            await this._loadFromOffline(id);
        }
    }

    async _renderStoryDetail() {
        const container = document.getElementById('storyDetail');
        const loadingIndicator = document.getElementById('loadingIndicator');

        if (!this._story) {
            container.innerHTML = `
                <div class="error-state">
                    <i class="fas fa-exclamation-circle"></i>
                    <p>Cerita tidak ditemukan</p>
                    <a href="#/home" class="back-link">Kembali ke Beranda</a>
                </div>
            `;
            return;
        }

        container.innerHTML = `
            <article class="story-content">
                <header class="story-header">
                    <h2>${this._story.name}</h2>
                    <div class="story-meta">
                        <time datetime="${this._story.createdAt}">
                            ${new Date(this._story.createdAt).toLocaleDateString('id-ID')}
                        </time>
                        <span class="location">
                            <i class="fas fa-map-marker-alt"></i>
                            ${this._story.location || 'Lokasi tidak tersedia'}
                        </span>
                    </div>
                </header>

                <div class="story-media">
                    <img src="${this._story.photoUrl}" 
                        alt="Foto cerita ${this._story.name}"
                        class="story-image">
                </div>

                <div class="story-body">
                    <p>${this._story.description}</p>
                </div>

                <footer class="story-footer">
                    <button id="saveOffline" class="save-offline">
                        <i class="fas fa-download"></i> Simpan Offline
                    </button>
                    <button onclick="window.history.back()" class="back-button">
                        <i class="fas fa-arrow-left"></i> Kembali
                    </button>
                </footer>
            </article>
        `;

        loadingIndicator.style.display = 'none';
        this._initializeEventListeners();
    }

    async _saveToOffline() {
        if (this._story) {
            await StoryDB.saveStories([this._story]);
        }
    }

    async _loadFromOffline(id) {
        try {
            const stories = await StoryDB.getStories();
            this._story = stories.find(story => story.id === id);
            await this._renderStoryDetail();
        } catch (error) {
            console.error('Error loading from offline:', error);
            this._story = null;
            await this._renderStoryDetail();
        }
    }

    _initializeEventListeners() {
        const saveButton = document.getElementById('saveOffline');
        if (saveButton) {
            saveButton.addEventListener('click', async () => {
                try {
                    await this._saveToOffline();
                    this._showFeedback('Cerita berhasil disimpan offline');
                } catch (error) {
                    this._showFeedback('Gagal menyimpan cerita offline', true);
                }
            });
        }
    }

    _showFeedback(message, isError = false) {
        const feedback = document.createElement('div');
        feedback.className = `feedback-message ${isError ? 'error' : 'success'}`;
        feedback.textContent = message;
        this._container.appendChild(feedback);
        setTimeout(() => feedback.remove(), 3000);
    }
}

export default DetailView;