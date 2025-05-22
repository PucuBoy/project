
import routes from './routes.js';
import Auth from './utils/auth.js';
import ViewTransition from './utils/view-transition.js';

class App {
    constructor() {
        this._content = document.querySelector('#mainContent');
        this._transition = new ViewTransition();
        
        this._currentPage = null;
        this._initialAppShell();
    }

    _initialAppShell() {
        this._initSkipLink();
        window.addEventListener('hashchange', () => {
            this._handleRouteChange();
        });

        window.addEventListener('load', () => {
            if (!window.location.hash) {
                window.location.hash = '#/home';
            }
            this._handleRouteChange();
        });
    }

    _handleRouteChange() {
        const hash = window.location.hash.slice(1).toLowerCase() || '/home';
        const currentPage = hash.split('/')[1] || 'home';
        
        if (!Auth.isLoggedIn() && !['login', 'register'].includes(currentPage)) {
            window.location.hash = '#/login';
            return;
        }

        if (Auth.isLoggedIn() && ['login', 'register'].includes(currentPage)) {
            window.location.hash = '#/home';
            return;
        }

        this._renderPage();
    }

    async _renderPage() {
        try {
            const url = window.location.hash.slice(1).toLowerCase();
            const page = url === '' ? '/home' : url;
            
            const mainContent = document.querySelector('#mainContent');
            if (!mainContent) throw new Error('Main content element not found');
            
            await ViewTransition.start(async () => {
                const pageModule = await routes[page]();  // Add parentheses to call the function
                if (!pageModule) {
                    throw new Error('Page not found');
                }

                const view = new pageModule.default();
                const content = await view.render();
                
                mainContent.innerHTML = content;
                await view.afterRender();
            });
        } catch (error) {
            console.error('Error rendering page:', error);
        }
    }

    _initSkipLink() {
        const skipLink = document.querySelector('.skip-link');
        if (skipLink) {
            skipLink.addEventListener('click', (e) => {
                e.preventDefault();
                const mainContent = document.querySelector('[role="main"]');
                if (mainContent) {
                    mainContent.focus();
                }
            });
        }
    }
}

export default App;

// Initialize app
const app = new App();