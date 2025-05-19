class NotFoundView {
    constructor() {
        this._container = document.querySelector('#mainContent');
    }

    async render() {
        return `
            <div class="not-found-container">
                <div class="not-found-content">
                    <div class="error-code">404</div>
                    <h1>Halaman Tidak Ditemukan</h1>
                    <p>Maaf, halaman yang Anda cari tidak dapat ditemukan.</p>
                    <div class="not-found-actions">
                        <button onclick="window.history.back()" class="back-button">
                            <i class="fas fa-arrow-left"></i> Kembali
                        </button>
                        <a href="#/home" class="home-button">
                            <i class="fas fa-home"></i> Beranda
                        </a>
                    </div>
                </div>
            </div>
        `;
    }

    async afterRender() {
        // Additional functionality if needed
    }
}

export default NotFoundView;