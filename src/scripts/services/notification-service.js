import CONFIG from '../config/config.js';
import ApiService from './api-service.js';
import Auth from '../utils/auth.js';

const VAPID_PUBLIC_KEY = 'BCCs2eonMI-6H2ctvFaWg-UYdDv387Vno_bzUzALpB442r2lCnsHmtrx8biyPi_E-1fSGABK_Qs_GlvPoJJqxbk';

class NotificationService {
    static async initialize() {
        try {
            if (!('Notification' in window)) {
                throw new Error('Browser tidak mendukung notifikasi');
            }

            if (!('serviceWorker' in navigator)) {
                throw new Error('Browser tidak mendukung Service Worker');
            }

            if (!('PushManager' in window)) {
                throw new Error('Browser tidak mendukung Push Notification');
            }

            const permission = await Notification.requestPermission();
            if (permission !== 'granted') {
                throw new Error('Izin notifikasi tidak diberikan');
            }

            await this.registerServiceWorker();
            await this.setupPeriodicSync();
            return true;
        } catch (error) {
            console.error('Inisialisasi notifikasi gagal:', error);
            return false;
        }
    }

    static async setupPeriodicSync() {
        try {
            const registration = await navigator.serviceWorker.ready;
            if ('periodicSync' in registration) {
                const status = await navigator.permissions.query({
                    name: 'periodic-background-sync',
                });
                
                if (status.state === 'granted') {
                    await registration.periodicSync.register('check-stories', {
                        minInterval: 24 * 60 * 60 * 1000, // 24 hours
                    });
                }
            }
        } catch (error) {
            console.error('Failed to setup periodic sync:', error);
        }
    }

    static async registerServiceWorker() {
        try {
            if ('serviceWorker' in navigator) {
                const registration = await navigator.serviceWorker.register('/sw.js');
                return registration;
            }
            throw new Error('Service Worker not supported');
        } catch (error) {
            console.error('Failed to register service worker:', error);
            throw error;
        }
    }

    static async subscribeToPush(token) {
        try {
            const registration = await navigator.serviceWorker.ready;
            let subscription = await registration.pushManager.getSubscription();

            if (!subscription) {
                subscription = await registration.pushManager.subscribe({
                    userVisibleOnly: true,
                    applicationServerKey: this._urlBase64ToUint8Array(VAPID_PUBLIC_KEY)
                });
            }

            await ApiService.subscribePushNotification(token, {
                endpoint: subscription.endpoint,
                keys: {
                    p256dh: this._arrayBufferToBase64(subscription.getKey('p256dh')),
                    auth: this._arrayBufferToBase64(subscription.getKey('auth'))
                }
            });

            return subscription;
        } catch (error) {
            console.error('Failed to subscribe to push:', error);
            throw error;
        }
    }

    static _arrayBufferToBase64(buffer) {
        const binary = String.fromCharCode.apply(null, new Uint8Array(buffer));
        return btoa(binary);
    }

    static _urlBase64ToUint8Array(base64String) {
        const padding = '='.repeat((4 - base64String.length % 4) % 4);
        const base64 = (base64String + padding)
            .replace(/\-/g, '+')
            .replace(/_/g, '/');

        const rawData = window.atob(base64);
        const outputArray = new Uint8Array(rawData.length);

        for (let i = 0; i < rawData.length; ++i) {
            outputArray[i] = rawData.charCodeAt(i);
        }
        return outputArray;
    }

    static async showNotification(title, options = {}) {
        try {
            const registration = await navigator.serviceWorker.ready;
            const mergedOptions = {
                icon: '/icons/icon-192x192.png',
                badge: '/icons/icon-72x72.png',
                vibrate: [100, 50, 100],
                ...options,
                data: {
                    dateOfArrival: Date.now(),
                    ...options.data
                }
            };
            
            await registration.showNotification(title, mergedOptions);
        } catch (error) {
            console.error('Failed to show notification:', error);
        }
    }

    static async unsubscribeFromPush(token) {
        try {
            const registration = await navigator.serviceWorker.ready;
            const subscription = await registration.pushManager.getSubscription();
            
            if (subscription) {
                await ApiService.unsubscribePushNotification(token, subscription.endpoint);
                await subscription.unsubscribe();
                return true;
            }
            return false;
        } catch (error) {
            console.error('Failed to unsubscribe from push:', error);
            throw error;
        }
    }
}

export default NotificationService;