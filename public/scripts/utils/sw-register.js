const swRegister = async () => {
    if (!('serviceWorker' in navigator)) {
        console.log('Service Worker not supported in the browser');
        return;
    }

    try {
        const registration = await navigator.serviceWorker.register('/sw.js', {
            updateViaCache: 'none'
        });
        
        // Force update check
        if (registration.active) {
            registration.update();
        }

        console.log('Service worker registered');

        // Request notification permission
        if ('Notification' in window) {
            const permission = await Notification.requestPermission();
            if (permission === 'granted') {
                console.log('Notification permission granted');
            }
        }

        // Register periodic sync if supported
        if ('periodicSync' in registration) {
            const status = await navigator.permissions.query({
                name: 'periodic-background-sync',
            });

            if (status.state === 'granted') {
                try {
                    await registration.periodicSync.register('update-stories', {
                        minInterval: 24 * 60 * 60 * 1000, // 24 hours
                    });
                } catch (error) {
                    console.log('Periodic sync could not be registered:', error);
                }
            }
        }

        return registration;
    } catch (error) {
        console.log('Failed to register service worker:', error);
        return null;
    }
};

export default swRegister;