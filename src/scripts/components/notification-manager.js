import NotificationService from '../services/notification-service.js';
import Auth from '../utils/auth.js';

class NotificationManager {
    constructor() {
        this._initialized = false;
        this._notificationButton = document.getElementById('notificationToggle');
        this._initializeUI();
    }

    async _initializeUI() {
        if (!this._notificationButton) {
            this._notificationButton = document.createElement('button');
            this._notificationButton.id = 'notificationToggle';
            this._notificationButton.className = 'notification-toggle';
            document.body.appendChild(this._notificationButton);
        }

        this._updateButtonState();
        this._attachEventListeners();
        await this._checkNotificationStatus();
    }

    _updateButtonState() {
        const permission = Notification.permission;
        const isLoggedIn = Auth.isLoggedIn();

        if (!isLoggedIn) {
            this._notificationButton.style.display = 'none';
            return;
        }

        this._notificationButton.style.display = 'block';
        this._notificationButton.innerHTML = `
            <i class="fas fa-bell${permission === 'granted' ? '' : '-slash'}"></i>
            ${permission === 'granted' ? 'Notifikasi Aktif' : 'Aktifkan Notifikasi'}
        `;
        this._notificationButton.classList.toggle('active', permission === 'granted');
    }

    _attachEventListeners() {
        this._notificationButton.addEventListener('click', async () => {
            try {
                const token = Auth.getToken();
                if (!token) {
                    throw new Error('Silakan login terlebih dahulu');
                }

                if (!this._initialized) {
                    await NotificationService.initialize();
                    await NotificationService.subscribeToPush(token);
                    this._initialized = true;
                } else {
                    await NotificationService.unsubscribeFromPush(token);
                    this._initialized = false;
                }

                this._updateButtonState();
                this._showFeedback(this._initialized ? 'Notifikasi diaktifkan' : 'Notifikasi dinonaktifkan');
            } catch (error) {
                console.error('Notification toggle failed:', error);
                this._showFeedback(error.message, true);
            }
        });
    }

    async _checkNotificationStatus() {
        try {
            const registration = await navigator.serviceWorker.ready;
            const subscription = await registration.pushManager.getSubscription();
            this._initialized = !!subscription;
            this._updateButtonState();
        } catch (error) {
            console.error('Error checking notification status:', error);
        }
    }

    _showFeedback(message, isError = false) {
        const feedback = document.createElement('div');
        feedback.className = `notification-feedback ${isError ? 'error' : 'success'}`;
        feedback.textContent = message;
        
        document.body.appendChild(feedback);
        setTimeout(() => feedback.remove(), 3000);
    }
}

export default NotificationManager;