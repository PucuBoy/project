class HomePresenter {
    constructor(view, model) {
        this._view = view;
        this._model = model;
        this._page = 1;
        this._loading = false;
        this._hasMore = true;
    }

    async loadInitialStories() {
        this._page = 1;
        this._hasMore = true;
        await this.loadStories();
    }

    async loadStories() {
        if (this._loading || !this._hasMore) return;

        try {
            this._loading = true;
            this._view.showLoading(true);

            const response = await this._model.getStories(this._page, 10, 1);

            if (!response || response.error) {
                throw new Error(response?.message || 'Failed to load stories');
            }

            if (response.listStory && response.listStory.length > 0) {
                this._view.renderStories(response.listStory);
                this._page += 1;
            } else {
                this._hasMore = false;
                this._view.showEndMessage(true);
            }
        } catch (error) {
            console.error('Failed to load stories:', error);
        } finally {
            this._loading = false;
            this._view.showLoading(false);
        }
    }

    handleScroll({ scrollTop, scrollHeight, clientHeight }) {
        if (scrollTop + clientHeight >= scrollHeight - 5) {
            this.loadStories();
        }
    }

    logout() {
        this._model.removeToken();
        window.location.hash = '#/login';
    }
}

export default HomePresenter;