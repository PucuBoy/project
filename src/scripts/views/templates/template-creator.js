const createStoryItemTemplate = (story, isFavorite = false) => `
    <article class="story-item">
        <img class="story-image" src="${story.photoUrl}" alt="${story.description}">
        <div class="story-content">
            <h2>${story.name}</h2>
            <p>${story.description}</p>
            <time datetime="${story.createdAt}">${new Date(story.createdAt).toLocaleDateString()}</time>
            <button class="favorite-btn ${isFavorite ? 'active' : ''}" data-id="${story.id}" aria-label="${isFavorite ? 'Remove from favorites' : 'Add to favorites'}">
                <i class="${isFavorite ? 'fas' : 'far'} fa-heart"></i>
            </button>
        </div>
    </article>
`;

export { createStoryItemTemplate };