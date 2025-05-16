class LoginPresenter {
    constructor(view, model) {
        this._view = view;
        this._model = model;
    }

    async login(email, password) {
        try {
            const response = await this._model.login(email, password);
            if (!response.error) {
                this._model.setToken(response.loginResult.token);
                return { success: true };
            }
            throw new Error(response.message);
        } catch (error) {
            return { 
                success: false, 
                error: error.message || 'Login failed' 
            };
        }
    }
}

export default LoginPresenter;