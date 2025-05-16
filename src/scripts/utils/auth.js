class Auth {
    static TOKEN_KEY = 'token';

    static setToken(token) {
        localStorage.setItem(this.TOKEN_KEY, token);
    }

    static getToken() {
        return localStorage.getItem(this.TOKEN_KEY);
    }

    static removeToken() {
        localStorage.removeItem(this.TOKEN_KEY);
    }

    static isLoggedIn() {
        return !!this.getToken();
    }
}

export default Auth;