import NotificationPreferences from '../components/notification-preferences.js';
import Auth from '../utils/auth.js';
import NotificationService from '../services/notification-service.js';

class ProfileView {
    constructor() {
        this._container = document.querySelector('#mainContent');
    }

    async render() {
        return `
            <div class="profile-container">
                <header class="profile-header">
                    <h2>Profil Pengguna</h2>
                </header>
                
                <div class="profile-content">
                    <section class="user-info">
                        <h3>Informasi Akun</h3>
                        <div class="info-item">
                            <span>Nama:</span>
                            <span id="userName">${Auth.getUserInfo().name}</span>
                        </div>
                        <div class="info-item">
                            <span>Email:</span>
                            <span id="userEmail">${Auth.getUserInfo().email}</span>
                        </div>
                    </section>

                    <section id="notificationSettings" class="notification-settings">
                        <!-- Notification preferences will be rendered here -->
                    </section>

                    <section class="offline-settings">
                        <h3>Pengaturan Offline</h3>
                        <div class="setting-item">
                            <label for="offlineStorage">
                                <input type="checkbox" id="offlineStorage" name="offlineStorage">
                                Simpan cerita untuk mode offline
                            </label>
                            <p class="setting-description">
                                Mengaktifkan fitur ini akan menyimpan cerita untuk diakses saat offline
                            </p>
                        </div>
                    </section>
                </div>
            </div>
        `;
    }

    async afterRender() {
        this._initializeNotificationPreferences();
        this._initializeOfflineSettings();
        this._attachEventListeners();
    }

    _initializeNotificationPreferences() {
        const container = document.getElementById('notificationSettings');
        if (container) {
            this._notificationPreferences = new NotificationPreferences(container);
        }
    }

    _initializeOfflineSettings() {
        const offlineStorage = document.getElementById('offlineStorage');
        if (offlineStorage) {
            offlineStorage.checked = localStorage.getItem('enableOfflineStorage') === 'true';
        }
    }

    _attachEventListeners() {
        const offlineStorage = document.getElementById('offlineStorage');
        if (offlineStorage) {
            offlineStorage.addEventListener('change', (e) => {
                localStorage.setItem('enableOfflineStorage', e.target.checked);
                this._showFeedback('Pengaturan offline berhasil disimpan');
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

    async cleanup() {
        // Cleanup if needed
    }
}

export default ProfileView;