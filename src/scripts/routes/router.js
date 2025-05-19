import routes from '../routes.js';
import UrlParser from './url-parser.js';

class Router {
    constructor(container) {
        this._container = container;
        this._currentPage = null;
    }

    async renderPage() {
        try {
            const url = UrlParser.parseActiveUrlWithCombiner();
            const page = routes[url] || routes['/404'];
            
            if (this._currentPage) {
                await this._currentPage.cleanup?.();
            }

            this._currentPage = new page();
            const content = await this._currentPage.render();
            this._container.innerHTML = content;

            await this._currentPage.afterRender?.();
            window.scrollTo(0, 0);

        } catch (error) {
            console.error('Error rendering page:', error);
            const notFoundPage = new routes['/404']();
            this._container.innerHTML = await notFoundPage.render();
        }
    }
}

export default Router;