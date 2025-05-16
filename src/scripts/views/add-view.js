import ApiService from '../services/api-service.js';
import Auth from '../utils/auth.js';
import Camera from '../utils/camera.js';
import CONFIG from '../config/config.js';
import StoryModel from '../models/story-model.js';
import AddPresenter from '../presenters/add-presenter.js';

class AddView {
    constructor() {
        this._map = null;
        this._camera = null;
        this._selectedLocation = null;
        this._model = new StoryModel(ApiService, Auth);
        this._presenter = new AddPresenter(this, this._model);
        this._handleNavigation = this._handleNavigation.bind(this);
    }

    async render() {
        return `
            <div class="add-story" role="main">
                <h1>Tambah Cerita Baru</h1>
                <form id="addStoryForm" class="story-form">
                    <div class="form-group">
                        <label for="description" id="descriptionLabel">Ceritakan kisahmu</label>
                        <textarea 
                            id="description" 
                            required 
                            aria-labelledby="descriptionLabel"
                        ></textarea>
                    </div>

                    <div class="form-group">
                        <label>Foto</label>
                        <div class="camera-container">
                            <video id="camera" autoplay playsinline></video>
                            <canvas id="photoPreview" style="display: none;"></canvas>
                            <div class="camera-controls">
                                <button type="button" id="startCamera" class="camera-button">
                                    <i class="fas fa-camera"></i> Buka Kamera
                                </button>
                                <button type="button" id="takePhoto" class="camera-button" disabled>
                                    <i class="fas fa-camera-retro"></i> Ambil Foto
                                </button>
                                <button type="button" id="retakePhoto" class="camera-button" style="display: none;">
                                    <i class="fas fa-redo"></i> Ambil Ulang
                                </button>
                            </div>
                        </div>
                    </div>

                    <div class="form-group">
                        <label>Lokasi</label>
                        <div id="locationMap" class="location-map"></div>
                        <p id="selectedLocation" class="location-info">
                            Klik pada peta untuk memilih lokasi
                        </p>
                    </div>

                    <div class="form-actions">
                        <button type="submit" id="submitStory">Bagikan Cerita</button>
                        <a href="#/home" class="cancel-button">Batal</a>
                    </div>
                </form>
            </div>
        `;
    }

    async afterRender() {
        await this._initializeMap();
        await this._initializeCamera();
        this._initializeEventListeners();
        window.addEventListener('hashchange', this._handleNavigation);
    }

    async cleanup() {
        window.removeEventListener('hashchange', this._handleNavigation);
        if (this._camera) {
            this._camera.stop();
            this._camera = null;
        }
    }

    _initializeMap() {
        try {
            const mapElement = document.getElementById('locationMap');
            if (!mapElement) {
                console.warn('Map element not found');
                return;
            }
            
            this._map = L.map('locationMap').setView(
                [CONFIG.DEFAULT_MAP_CENTER.lat, CONFIG.DEFAULT_MAP_CENTER.lon],
                CONFIG.MAP_OPTIONS.DEFAULT_ZOOM
            );

            L.tileLayer(CONFIG.MAP_OPTIONS.TILE_LAYER.DEFAULT, {
                attribution: '© OpenStreetMap contributors'
            }).addTo(this._map);

            let marker = null;
            this._map.on('click', (e) => {
                this._selectedLocation = e.latlng;
                
                if (marker) {
                    marker.remove();
                }
                
                marker = L.marker([e.latlng.lat, e.latlng.lng]).addTo(this._map);
                
                this._updateLocationInfo();
            });

            setTimeout(() => {
                this._map.invalidateSize();
            }, 100);
        } catch (error) {
            console.error('Failed to initialize map:', error);
            alert('Gagal memuat peta. Silakan muat ulang halaman.');
        }
    }

    _initializeCamera() {
        try {
            const video = document.getElementById('camera');
            if (!video) {
                console.warn('Camera element not found');
                return;
            }
            this._camera = new Camera(video);
        } catch (error) {
            console.error('Failed to initialize camera:', error);
        }
    }

    _updateLocationInfo() {
        const locationInfo = document.getElementById('selectedLocation');
        if (this._selectedLocation) {
            locationInfo.textContent = `Lokasi dipilih: ${this._selectedLocation.lat.toFixed(6)}, ${this._selectedLocation.lng.toFixed(6)}`;
        }
    }

    _initializeEventListeners() {
        const startCameraBtn = document.getElementById('startCamera');
        const takePhotoBtn = document.getElementById('takePhoto');
        const retakePhotoBtn = document.getElementById('retakePhoto');
        const form = document.getElementById('addStoryForm');
        const video = document.getElementById('camera');
        const canvas = document.getElementById('photoPreview');
        let capturedPhoto = null;

        startCameraBtn.addEventListener('click', async () => {
            try {
                await this._camera.start();
                startCameraBtn.style.display = 'none';
                takePhotoBtn.disabled = false;
                video.style.display = 'block';
                canvas.style.display = 'none';
            } catch (error) {
                alert('Tidak dapat mengakses kamera');
            }
        });

        takePhotoBtn.addEventListener('click', async () => {
            capturedPhoto = await this._camera.takePhoto();
            const photoUrl = URL.createObjectURL(capturedPhoto);
            
            canvas.style.display = 'block';
            video.style.display = 'none';
            takePhotoBtn.style.display = 'none';
            retakePhotoBtn.style.display = 'block';

            const context = canvas.getContext('2d');
            const img = new Image();
            img.onload = () => {
                canvas.width = img.width;
                canvas.height = img.height;
                context.drawImage(img, 0, 0);
            };
            img.src = photoUrl;
            
            this._camera.stop();
        });

        retakePhotoBtn.addEventListener('click', async () => {
            await this._camera.start();
            video.style.display = 'block';
            canvas.style.display = 'none';
            takePhotoBtn.style.display = 'block';
            retakePhotoBtn.style.display = 'none';
            capturedPhoto = null;
        });

        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const description = document.getElementById('description').value;
            if (!description.trim()) {
                alert('Silakan isi deskripsi cerita');
                return;
            }

            if (!this._selectedLocation) {
                alert('Silakan pilih lokasi pada peta');
                return;
            }

            if (!capturedPhoto) {
                alert('Silakan ambil foto terlebih dahulu');
                return;
            }

            try {
                const loadingOverlay = document.createElement('div');
                loadingOverlay.className = 'loading-overlay';
                loadingOverlay.innerHTML = '<div class="loading-spinner"></div>';
                document.body.appendChild(loadingOverlay);

                const result = await this._presenter.submitStory(
                    description,
                    capturedPhoto,
                    this._selectedLocation
                );

                if (result.success) {
                    alert('Cerita berhasil dibagikan!');
                    window.location.hash = '#/home';
                } else {
                    throw new Error(result.error);
                }
            } catch (error) {
                console.error('Failed to add story:', error);
                alert(`Gagal menambahkan cerita: ${error.message}`);
            } finally {
                const loadingOverlay = document.querySelector('.loading-overlay');
                if (loadingOverlay) {
                    loadingOverlay.remove();
                }
            }
        });
    }

    _handleNavigation() {
        if (this._camera && this._camera.isStreamActive()) {
            this._camera.stop();
        }
    }
}

export default AddView;