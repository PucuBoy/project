import DBService from '../../services/db-service.js';

class Favorites {
    async render() {
        return `
            <div class="stories">
                <div class="stories-header">
                    <h1>Favorite Stories</h1>
                    <nav>
                        <a href="#/" class="nav-link" aria-label="Back to home">
                            <i class="fas fa-arrow-left"></i> Back
                        </a>
                    </nav>
                </div>
                <div id="favoritesList" class="story-list">
                    <div class="loading-spinner"></div>
                </div>
            </div>
        `;
    }

    async afterRender() {
        const favoritesList = document.getElementById('favoritesList');
        const favorites = await DBService.getFavorites();

        if (favorites.length === 0) {
            favoritesList.innerHTML = `
                <div class="end-message">
                    <p>No favorite stories yet</p>
                </div>
            `;
            return;
        }

        favoritesList.innerHTML = favorites.map(story => `
            <article class="story-item">
                <img class="story-image" src="${story.photoUrl}" alt="${story.description}">
                <div class="story-content">
                    <h2>${story.name}</h2>
                    <p>${story.description}</p>
                    <time datetime="${story.createdAt}">${new Date(story.createdAt).toLocaleDateString()}</time>
                    <button class="remove-favorite" data-id="${story.id}">
                        Remove from Favorites
                    </button>
                </div>
            </article>
        `).join('');

        this._initializeEventListeners(favoritesList);
    }

    _initializeEventListeners(favoritesList) {
        favoritesList.addEventListener('click', async (e) => {
            if (e.target.classList.contains('remove-favorite')) {
                const id = e.target.dataset.id;
                await DBService.removeFromFavorites(id);
                e.target.closest('.story-item').remove();

                if (favoritesList.children.length === 0) {
                    favoritesList.innerHTML = `
                        <div class="end-message">
                            <p>No favorite stories yet</p>
                        </div>
                    `;
                }
            }
        });
    }
}

export default Favorites;