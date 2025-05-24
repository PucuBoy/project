import StoryModel from '../models/story-model.js';
import HomePresenter from '../presenters/home-presenter.js';
import ApiService from '../services/api-service.js';
import DBService from '../services/db-service.js';  // Add this line
import Auth from '../utils/auth.js';
import CONFIG from '../config/config.js';
import NotificationManager from '../components/notification-manager.js';

class HomeView {
    constructor() {
        this._model = new StoryModel(ApiService, Auth);
        this._presenter = new HomePresenter(this, this._model);
        this._map = null;
        this._markers = [];
        this._notificationManager = null;
    }

    async render() {
        return `
            <div class="stories">
                <header class="stories-header">
                    <h1>Story Explorer</h1>
                    <nav>
                        <button id="logoutBtn" class="nav-link" aria-label="Logout">
                            <i class="fas fa-sign-out-alt"></i> Logout
                        </button>
                        <a href="#/favorites" class="nav-link favorite-link" aria-label="View favorite stories">
                            <i class="fas fa-heart"></i>
                        </a>
                    </nav>
                </header>
                
                <div id="map" class="story-map" role="application" aria-label="Peta lokasi cerita"></div>
                
                <div class="story-container">
                    <div id="storyList" class="story-list" role="list"></div>
                    <div id="loading" class="loading-spinner" style="display: none">
                        <span class="sr-only">Memuat cerita...</span>
                    </div>
                    <div id="endMessage" class="end-message" style="display: none">
                        <p>Tidak ada cerita lagi</p>
                    </div>
                </div>

                <a href="#/add" class="fab" aria-label="Tambah cerita baru">
                    <i class="fas fa-plus"></i>
                </a>
            </div>
        `;
    }

    async afterRender() {
        try {
            await this._initializeMap();
            this._initializeEventListeners();
            await this._presenter.loadInitialStories();
            
            // Initialize notification manager only once
            if (!this._notificationManager) {
                this._notificationManager = new NotificationManager();
            }

            // Listen for new story notifications
            window.addEventListener('story-created', async () => {
                await this._presenter.loadInitialStories();
            });
        } catch (error) {
            console.error('Error in afterRender:', error);
            alert('Terjadi kesalahan saat memuat halaman');
        }
    }

    async _initializeMap() {
        const mapElement = document.getElementById('map');
        if (!mapElement) return;

        this._map = L.map('map').setView(
            [CONFIG.DEFAULT_MAP_CENTER.lat, CONFIG.DEFAULT_MAP_CENTER.lon],
            CONFIG.MAP_OPTIONS.DEFAULT_ZOOM
        );

        const defaultLayer = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '© OpenStreetMap contributors'
        });

        const satelliteLayer = L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
            attribution: '© Esri'
        });

        const topoLayer = L.tileLayer('https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png', {
            attribution: '© OpenTopoMap contributors'
        });

        const baseMaps = {
            "Street": defaultLayer,
            "Satellite": satelliteLayer,
            "Topographic": topoLayer
        };

        defaultLayer.addTo(this._map);
        L.control.layers(baseMaps).addTo(this._map);

        setTimeout(() => this._map.invalidateSize(), 100);
    }

    _initializeEventListeners() {
        const logoutBtn = document.getElementById('logoutBtn');
        if (logoutBtn) {
            logoutBtn.addEventListener('click', () => this._presenter.logout());
        }

        window.addEventListener('scroll', () => {
            const { scrollTop, scrollHeight, clientHeight } = document.documentElement;
            this._presenter.handleScroll({ scrollTop, scrollHeight, clientHeight });
        });
    }

    showLoading(show) {
        const loadingElement = document.getElementById('loading');
        if (loadingElement) {
            loadingElement.style.display = show ? 'block' : 'none';
        }
    }

    showEndMessage(show) {
        const endMessage = document.getElementById('endMessage');
        if (endMessage) {
            endMessage.style.display = show ? 'block' : 'none';
        }
    }

    renderStories(stories) {
        const storyList = document.getElementById('storyList');
        if (!storyList) return;

        stories.forEach(story => {
            const storyElement = this._createStoryElement(story);
            if (storyElement) {
                storyList.appendChild(storyElement);
                if (story.lat && story.lon) {
                    this._addMarker(story);
                }
            }
        });
    }

    _createStoryElement(story) {
        const article = document.createElement('article');
        article.className = 'story-item';
        article.setAttribute('role', 'article');
        article.dataset.storyId = story.id;
        article.innerHTML = `
            <img src="${story.photoUrl}" 
                alt="Story image: ${story.description.slice(0, 50)}..." 
                class="story-image">
            <div class="story-content">
                <h2>${story.name}</h2>
                <p>${story.description}</p>
                <time datetime="${story.createdAt}" aria-label="Posted on">
                    ${new Date(story.createdAt).toLocaleDateString('id-ID')}
                </time>
                <button class="favorite-btn" data-id="${story.id}" aria-label="Add to favorites">
                    <i class="far fa-heart"></i>
                </button>
            </div>
        `;

        const favoriteBtn = article.querySelector('.favorite-btn');
        this._initializeFavoriteButton(favoriteBtn, story);

        article.addEventListener('click', (e) => {
            if (!e.target.closest('.favorite-btn')) {
                this._handleStoryClick(article);
            }
        });

        return article;
    }

    async _initializeFavoriteButton(button, story) {
        const isFavorite = await DBService.isFavorite(story.id);
        if (isFavorite) {
            button.classList.add('active');
            button.querySelector('i').classList.replace('far', 'fas');
        }

        button.addEventListener('click', async (e) => {
            e.stopPropagation();
            if (button.classList.contains('active')) {
                await DBService.removeFromFavorites(story.id);
                button.classList.remove('active');
                button.querySelector('i').classList.replace('fas', 'far');
            } else {
                await DBService.addToFavorites(story);
                button.classList.add('active');
                button.querySelector('i').classList.replace('far', 'fas');
            }
        });
    }

    _handleStoryClick(article) {
        if (!document.querySelector('.overlay')) {
            const overlay = document.createElement('div');
            overlay.className = 'overlay';
            document.body.appendChild(overlay);
            overlay.addEventListener('click', () => this._handleOverlayClick(overlay, article));
            setTimeout(() => overlay.classList.add('active'), 0);
        }

        if (document.startViewTransition) {
            document.startViewTransition(() => {
                article.classList.add('expanded');
            });
        } else {
            article.classList.add('expanded');
        }
    }

    _handleOverlayClick(overlay, article) {
        if (document.startViewTransition) {
            document.startViewTransition(() => {
                article.classList.remove('expanded');
                overlay.classList.remove('active');
                setTimeout(() => overlay.remove(), 300);
            });
        } else {
            article.classList.remove('expanded');
            overlay.classList.remove('active');
            setTimeout(() => overlay.remove(), 300);
        }
    }

    _addMarker(story) {
        const marker = L.marker([story.lat, story.lon])
            .bindPopup(`
                <div class="map-popup">
                    <h3>${story.name}</h3>
                    <img src="${story.photoUrl}" alt="Foto dari ${story.name}">
                    <p>${story.description}</p>
                </div>
            `);
        
        marker.addTo(this._map);
        this._markers.push(marker);
    }

    async cleanup() {
        window.removeEventListener('scroll', this._handleScroll);
        
        if (this._markers) {
            this._markers.forEach(marker => marker.remove());
            this._markers = [];
        }
        
        if (this._map) {
            this._map.remove();
            this._map = null;
        }

        // Cleanup notification manager
        if (this._notificationManager) {
            this._notificationManager.cleanup();
            this._notificationManager = null;
        }
    }
}

export default HomeView;