class ViewTransition {
    static async start(callback) {
        if (!document.startViewTransition) {
            return callback();
        }

        try {
            const transition = await document.startViewTransition(async () => {
                // Add animation class before transition
                document.documentElement.classList.add('view-transition');
                await callback();
            });

            // Wait for the transition to complete
            await transition.finished;
            document.documentElement.classList.remove('view-transition');
            return transition;
        } catch (error) {
            console.warn('View transition failed:', error);
            return callback();
        }
    }

    static updateDOM(content) {
        const mainContent = document.querySelector('#mainContent');
        if (!mainContent) return;

        return this.start(() => {
            mainContent.innerHTML = content;
            // Trigger animation after content update
            const newPage = mainContent.firstElementChild;
            if (newPage) {
                newPage.classList.add('page-transition');
                requestAnimationFrame(() => {
                    newPage.classList.add('visible');
                });
            }
        });
    }
}

export default ViewTransition;