import NotificationService from '../services/notification-service.js';
import Auth from '../utils/auth.js';

class NotificationPreferences {
    constructor(container) {
        this._container = container;
        this._render();
        this._initializeEventListeners();
    }

    _render() {
        this._container.innerHTML = `
            <div class="notification-preferences">
                <h3>Pengaturan Notifikasi</h3>
                <div class="preference-item">
                    <label for="newStoryNotif">
                        <input type="checkbox" id="newStoryNotif" name="newStoryNotif">
                        Notifikasi Cerita Baru
                    </label>
                </div>
                <div class="preference-item">
                    <label for="commentNotif">
                        <input type="checkbox" id="commentNotif" name="commentNotif">
                        Notifikasi Komentar
                    </label>
                </div>
                <button id="savePreferences" class="save-preferences">
                    Simpan Pengaturan
                </button>
            </div>
        `;
    }

    async _initializeEventListeners() {
        const saveButton = this._container.querySelector('#savePreferences');
        if (saveButton) {
            saveButton.addEventListener('click', async () => {
                await this._savePreferences();
            });
        }

        await this._loadPreferences();
    }

    async _savePreferences() {
        try {
            const preferences = {
                newStory: this._container.querySelector('#newStoryNotif').checked,
                comments: this._container.querySelector('#commentNotif').checked
            };

            localStorage.setItem('notificationPreferences', JSON.stringify(preferences));
            this._showFeedback('Pengaturan berhasil disimpan');
        } catch (error) {
            console.error('Error saving preferences:', error);
            this._showFeedback('Gagal menyimpan pengaturan', true);
        }
    }

    async _loadPreferences() {
        try {
            const savedPreferences = localStorage.getItem('notificationPreferences');
            if (savedPreferences) {
                const preferences = JSON.parse(savedPreferences);
                this._container.querySelector('#newStoryNotif').checked = preferences.newStory;
                this._container.querySelector('#commentNotif').checked = preferences.comments;
            }
        } catch (error) {
            console.error('Error loading preferences:', error);
        }
    }

    _showFeedback(message, isError = false) {
        const feedback = document.createElement('div');
        feedback.className = `notification-feedback ${isError ? 'error' : 'success'}`;
        feedback.textContent = message;
        this._container.appendChild(feedback);
        setTimeout(() => feedback.remove(), 3000);
    }
}

export default NotificationPreferences;