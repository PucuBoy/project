import StoryModel from '../models/story-model.js';
import LoginPresenter from '../presenters/login-presenter.js';
import ApiService from '../services/api-service.js';
import Auth from '../utils/auth.js';

class LoginView {
    constructor() {
        this._model = new StoryModel(ApiService, Auth);
        this._presenter = new LoginPresenter(this, this._model);
    }

    async render() {
        return `
            <div class="auth-container">
                <h1>Login</h1>
                <form id="loginForm" class="auth-form">
                    <div class="form-group">
                        <label for="email">Email</label>
                        <input type="email" id="email" name="email" required>
                    </div>
                    <div class="form-group">
                        <label for="password">Password</label>
                        <input type="password" id="password" name="password" required>
                    </div>
                    <button type="submit">Login</button>
                    <p>Don't have an account? <a href="#/register">Register here</a></p>
                </form>
            </div>
        `;
    }

    async afterRender() {
        const form = document.getElementById('loginForm');
        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            const email = document.getElementById('email').value;
            const password = document.getElementById('password').value;

            const result = await this._presenter.login(email, password);
            if (result.success) {
                window.location.hash = '#/home';
            } else {
                alert(result.error);
            }
        });
    }
}

export default LoginView;