class AddPresenter {
    constructor(view, model) {
        this._view = view;
        this._model = model;
    }

    async submitStory(description, photo, location) {
        try {
            const response = await this._model.addStory({
                description,
                photo,
                lat: location.lat,
                lon: location.lng
            });

            if (!response.error) {
                return { success: true };
            }
            throw new Error(response.message);
        } catch (error) {
            return { 
                success: false, 
                error: error.message || 'Terjadi kesalahan'
            };
        }
    }
}

export default AddPresenter;