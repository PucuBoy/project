import CONFIG from '../config/config.js';

class ApiService {
    static async getStories(token, { page = 1, size = 10, location = 1 } = {}) {
        const response = await fetch(
            `${CONFIG.BASE_URL}/stories?page=${page}&size=${size}&location=${location}`,
            {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            }
        );
        return response.json();
    }

    static async addStory(token, { description, photo, lat, lon }) {
        const formData = new FormData();
        formData.append('description', description);
        formData.append('photo', photo);
        
        if (lat && lon) {
            formData.append('lat', lat);
            formData.append('lon', lon);
        }

        const response = await fetch(`${CONFIG.BASE_URL}/stories`, {
            method: 'POST',
            headers: {
                Authorization: `Bearer ${token}`,
            },
            body: formData,
        });

        return response.json();
    }

    static async login(data) {
        const response = await fetch(`${CONFIG.BASE_URL}/login`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(data)
        });

        const responseJson = await response.json();
        return responseJson;
    }

    static async register(name, email, password) {
        const response = await fetch(`${CONFIG.BASE_URL}/register`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ name, email, password }),
        });
        return response.json();
    }

    static async getStoryDetail(token, id) {
        try {
            const response = await fetch(`${CONFIG.API_URL}/stories/${id}`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            return await response.json();
        } catch (error) {
            console.error('Error fetching story detail:', error);
            return { error: true, message: error.message };
        }
    }

    static async addGuestStory(data) {
        try {
            const formData = new FormData();
            formData.append('description', data.description);
            formData.append('photo', data.photo);
            if (data.lat) formData.append('lat', data.lat);
            if (data.lon) formData.append('lon', data.lon);

            const response = await fetch(`${CONFIG.API_URL}/stories/guest`, {
                method: 'POST',
                body: formData
            });
            return await response.json();
        } catch (error) {
            console.error('Error adding guest story:', error);
            return { error: true, message: error.message };
        }
    }

    static async subscribePushNotification(token, subscription) {
        try {
            const response = await fetch(`${CONFIG.BASE_URL}/push`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(subscription)
            });
            return await response.json();
        } catch (error) {
            console.error('Error subscribing to notifications:', error);
            return { error: true, message: error.message };
        }
    }

    static async unsubscribePushNotification(token, endpoint) {
        try {
            const response = await fetch(`${CONFIG.BASE_URL}/push`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ endpoint })
            });
            return await response.json();
        } catch (error) {
            console.error('Error unsubscribing from notifications:', error);
            return { error: true, message: error.message };
        }
    }

    static async syncOfflineStories(token, stories) {
        try {
            const results = await Promise.allSettled(
                stories.map(story => this.addStory(token, story))
            );
            
            return results.map((result, index) => ({
                story: stories[index],
                success: result.status === 'fulfilled',
                response: result.status === 'fulfilled' ? result.value : result.reason
            }));
        } catch (error) {
            console.error('Error syncing offline stories:', error);
            return { error: true, message: error.message };
        }
    }

    static async registerPushSubscription(token, subscription) {
        try {
            const response = await fetch(`${CONFIG.BASE_URL}/push-registration`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(subscription)
            });
            return await response.json();
        } catch (error) {
            console.error('Error registering push subscription:', error);
            return { error: true, message: error.message };
        }
    }

    static async checkConnectivity() {
        try {
            const response = await fetch(`${CONFIG.BASE_URL}/ping`, {
                method: 'HEAD'
            });
            return response.ok;
        } catch {
            return false;
        }
    }

    static async retryFailedUploads(token, failedUploads) {
        try {
            const results = await Promise.allSettled(
                failedUploads.map(upload => this.addStory(token, upload.data))
            );
            return results.map((result, index) => ({
                originalUpload: failedUploads[index],
                success: result.status === 'fulfilled',
                response: result.status === 'fulfilled' ? result.value : result.reason
            }));
        } catch (error) {
            console.error('Error retrying failed uploads:', error);
            return { error: true, message: error.message };
        }
    }
}

export default ApiService;