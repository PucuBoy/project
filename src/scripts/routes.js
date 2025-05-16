const routes = {
    '/': import('./views/home-view.js'),
    '/home': import('./views/home-view.js'),
    '/add': import('./views/add-view.js'),
    '/login': import('./views/login-view.js'),
    '/register': import('./views/register-view.js'),
};

export default routes;