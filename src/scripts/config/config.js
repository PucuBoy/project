const CONFIG = {
    BASE_URL: 'https://story-api.dicoding.dev/v1',
    VAPID_PUBLIC_KEY: 'BCCs2eonMI-6H2ctvFaWg-UYdDv387Vno_bzUzALpB442r2lCnsHmtrx8biyPi_E-1fSGABK_Qs_GlvPoJJqxbk',
    DEFAULT_MAP_CENTER: {
        lat: -6.200000,
        lon: 106.816666
    },
    MAP_OPTIONS: {
        DEFAULT_ZOOM: 5,
        TILE_LAYER: {
            DEFAULT: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
            SATELLITE: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}'
        }
    }
};

export default CONFIG;