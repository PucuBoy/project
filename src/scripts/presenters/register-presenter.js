class RegisterPresenter {
    constructor(view, model) {
        this._view = view;
        this._model = model;
    }

    async register(name, email, password) {
        try {
            const response = await this._model.register({ name, email, password });
            return { success: !response.error };
        } catch (error) {
            return { 
                success: false, 
                error: error.message || 'Registration failed' 
            };
        }
    }
}

export default RegisterPresenter;