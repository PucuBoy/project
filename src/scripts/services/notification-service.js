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

            const permission = await Notification.requestPermission();
            if (permission !== 'granted') {
                throw new Error('Izin notifikasi tidak diberikan');
            }

            await this.registerServiceWorker();
            return true;
        } catch (error) {
            console.error('Inisialisasi notifikasi gagal:', error);
            return false;
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
            const registration = await this.registerServiceWorker();
            const subscription = await registration.pushManager.subscribe({
                userVisibleOnly: true,
                applicationServerKey: VAPID_PUBLIC_KEY
            });

            await ApiService.subscribePushNotification(token, {
                endpoint: subscription.endpoint,
                keys: {
                    p256dh: btoa(String.fromCharCode.apply(null, 
                        new Uint8Array(subscription.getKey('p256dh')))),
                    auth: btoa(String.fromCharCode.apply(null, 
                        new Uint8Array(subscription.getKey('auth'))))
                }
            });

            return subscription;
        } catch (error) {
            console.error('Failed to subscribe to push:', error);
            throw error;
        }
    }

    static async unsubscribeFromPush(token) {
        try {
            const registration = await navigator.serviceWorker.ready;
            const subscription = await registration.pushManager.getSubscription();
            
            if (subscription) {
                await ApiService.unsubscribePushNotification(token, subscription.endpoint);
                await subscription.unsubscribe();
            }
        } catch (error) {
            console.error('Failed to unsubscribe from push:', error);
            throw error;
        }
    }
}

export default NotificationService;