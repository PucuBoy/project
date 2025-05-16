import StoryModel from '../models/story-model.js';
import RegisterPresenter from '../presenters/register-presenter.js';
import ApiService from '../services/api-service.js';
import Auth from '../utils/auth.js';

class RegisterView {
    constructor() {
        this._model = new StoryModel(ApiService, Auth);
        this._presenter = new RegisterPresenter(this, this._model);
    }

    async render() {
        return `
            <div class="auth-container">
                <h1>Register</h1>
                <form id="registerForm" class="auth-form">
                    <div class="form-group">
                        <label for="name">Name</label>
                        <input type="text" id="name" required>
                    </div>
                    <div class="form-group">
                        <label for="email">Email</label>
                        <input type="email" id="email" required>
                    </div>
                    <div class="form-group">
                        <label for="password">Password</label>
                        <input type="password" id="password" required>
                    </div>
                    <button type="submit">Register</button>
                    <p>Already have an account? <a href="#/login">Login here</a></p>
                </form>
            </div>
        `;
    }

    async afterRender() {
        const form = document.getElementById('registerForm');
        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            const name = document.getElementById('name').value;
            const email = document.getElementById('email').value;
            const password = document.getElementById('password').value;

            const result = await this._presenter.register(name, email, password);
            if (result.success) {
                alert('Registration successful! Please login.');
                window.location.hash = '#/login';
            } else {
                alert(result.error);
            }
        });
    }
}

export default RegisterView;