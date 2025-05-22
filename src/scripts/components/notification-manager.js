import NotificationService from '../services/notification-service.js';
import Auth from '../utils/auth.js';

class NotificationManager {
    constructor() {
        this._initialized = false;
        this._notificationButton = null;
        this._initializeUI();
        this._setupPushListener();
    }

    _setupPushListener() {
        if ('serviceWorker' in navigator) {
            navigator.serviceWorker.addEventListener('message', (event) => {
                if (event.data.type === 'STORY_CREATED') {
                    // Refresh stories list
                    window.dispatchEvent(new CustomEvent('story-created'));
                    
                    // Show notification feedback
                    this._showFeedback('Story baru telah ditambahkan');
                }
            });
        }
    }

    async _initializeUI() {
        // Only initialize if we're on the home page
        const isHomePage = window.location.hash === '#/' || window.location.hash === '#/home';
        if (!isHomePage) return;

        // Check if button already exists
        const existingButton = document.getElementById('notificationToggle');
        if (existingButton) {
            this._notificationButton = existingButton;
        } else {
            const nav = document.querySelector('.stories-header nav');
            if (nav) {
                this._notificationButton = document.createElement('button');
                this._notificationButton.id = 'notificationToggle';
                this._notificationButton.className = 'nav-link notification-toggle';
                nav.insertBefore(this._notificationButton, nav.lastElementChild);
            }
        }

        this._updateButtonState();
        this._attachEventListeners();
        await this._checkNotificationStatus();
    }

    _attachEventListeners() {
        if (!this._notificationButton) return;
        
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

    _updateButtonState() {
        if (!this._notificationButton) return;

        const permission = Notification.permission;
        const isLoggedIn = Auth.isLoggedIn();

        if (!isLoggedIn) {
            this._notificationButton.style.display = 'none';
            return;
        }

        this._notificationButton.style.display = 'block';
        this._notificationButton.innerHTML = `
            <i class="fas fa-bell${this._initialized ? '' : '-slash'}" aria-label="${this._initialized ? 'Nonaktifkan' : 'Aktifkan'} Notifikasi"></i>
        `;
        this._notificationButton.title = `${this._initialized ? 'Nonaktifkan' : 'Aktifkan'} Notifikasi`;
        this._notificationButton.classList.toggle('active', this._initialized);
    }
}

export default NotificationManager;