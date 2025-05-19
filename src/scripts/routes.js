const routes = {
    '/': () => import('./views/home-view.js'),
    '/home': () => import('./views/home-view.js'),
    '/add': () => import('./views/add-view.js'),
    '/login': () => import('./views/login-view.js'),
    '/register': () => import('./views/register-view.js'),
    '/profile': () => import('./views/profile-view.js'),
    '/offline': () => import('./views/offline-view.js'),
    '/404': () => import('./views/not-found-view.js'),
    '/story/:id': () => import('./views/detail-view.js'),
};

export default routes;