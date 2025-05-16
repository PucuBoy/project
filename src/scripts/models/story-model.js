class StoryModel {
    constructor(apiService, auth) {
        this._apiService = apiService;
        this._auth = auth;
    }

    async getStories(page, size, location) {
        const token = this._auth.getToken();
        return await this._apiService.getStories(token, { page, size, location });
    }

    async addStory(storyData) {
        const token = this._auth.getToken();
        return await this._apiService.addStory(token, storyData);
    }

    async login(email, password) {
        return await this._apiService.login({ email, password });
    }

    async register(userData) {
        return await this._apiService.register(userData);
    }

    setToken(token) {
        this._auth.setToken(token);
    }

    removeToken() {
        this._auth.removeToken();
    }
}

export default StoryModel;