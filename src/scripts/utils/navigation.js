import Auth from './auth.js';

const Navigation = {
    updateNavigation() {
        const currentPage = window.location.hash.slice(1).toLowerCase() || '/home';
 
        const navLinks = document.querySelectorAll('.nav-link');
        if (navLinks.length > 0) {
            navLinks.forEach(link => {
                const href = link.getAttribute('href');
                if (href && href.slice(1) === currentPage) {
                    link.classList.add('active');
                } else {
                    link.classList.remove('active');
                }
            });
        }
    }
};

export default Navigation;