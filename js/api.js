/**
 * ResellerHub AI - API Client
 * Updated for consolidated Vercel endpoints
 */

const API_BASE_URL = window.location.hostname === 'localhost' || window.location.protocol === 'file:'
    ? 'http://localhost:3000/api'
    : '/api';

const api = {
    getToken() { return localStorage.getItem('resellerhub_token'); },
    setToken(token) { localStorage.setItem('resellerhub_token', token); },
    clearToken() { localStorage.removeItem('resellerhub_token'); },

    async request(endpoint, options = {}) {
        const url = `${API_BASE_URL}${endpoint}`;
        const token = this.getToken();
        const config = {
            ...options,
            headers: {
                'Content-Type': 'application/json',
                ...(token && { Authorization: `Bearer ${token}` }),
                ...options.headers
            }
        };
        if (options.body && typeof options.body === 'object') {
            config.body = JSON.stringify(options.body);
        }
        const response = await fetch(url, config);
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || 'Terjadi kesalahan');
        return data;
    },

    get(endpoint) { return this.request(endpoint, { method: 'GET' }); },
    post(endpoint, body) { return this.request(endpoint, { method: 'POST', body }); },
    put(endpoint, body) { return this.request(endpoint, { method: 'PUT', body }); },
    delete(endpoint) { return this.request(endpoint, { method: 'DELETE' }); }
};

const authAPI = {
    async register(data) {
        const result = await api.post('/auth?action=register', data);
        if (result.token) {
            api.setToken(result.token);
            localStorage.setItem('resellerhub_user', JSON.stringify(result.user));
        }
        return result;
    },
    async login(email, password) {
        const result = await api.post('/auth?action=login', { email, password });
        if (result.token) {
            api.setToken(result.token);
            localStorage.setItem('resellerhub_user', JSON.stringify(result.user));
        }
        return result;
    },
    async getMe() { return api.get('/auth?action=me'); },
    logout() {
        api.clearToken();
        localStorage.removeItem('resellerhub_user');
        window.location.href = 'login.html';
    },
    isAuthenticated() { return !!api.getToken(); },
    getUser() {
        const user = localStorage.getItem('resellerhub_user');
        return user ? JSON.parse(user) : null;
    }
};

const productsAPI = {
    getAll() { return api.get('/products'); },
    getById(id) { return api.get(`/products?id=${id}`); },
    create(data) { return api.post('/products', data); },
    update(id, data) { return api.put(`/products?id=${id}`, data); },
    delete(id) { return api.delete(`/products?id=${id}`); }
};

const analyticsAPI = {
    getDashboard() { return api.get('/analytics'); }
};

const plansAPI = {
    getAll() { return api.get('/payment?action=plans'); }
};

const paymentAPI = {
    create(planId) { return api.post('/payment?action=create', { plan_id: planId }); },
    uploadProof(paymentId, proofUrl) { return api.post('/payment?action=confirm', { payment_id: paymentId, proof_url: proofUrl }); },
    getMyPayments() { return api.get('/payment?action=my_payments'); }
};

const aiAPI = {
    suggestPrice(product) { return api.post('/ai', { action: 'price', data: { product } }); },
    generateDescription(product) { return api.post('/ai', { action: 'description', data: { product } }); },
    getBusinessTips(context = {}) { return api.post('/ai', { action: 'tips', data: { context } }); },
    chat(message) { return api.post('/ai', { action: 'chat', data: { message } }); }
};

window.api = api;
window.authAPI = authAPI;
window.productsAPI = productsAPI;
window.analyticsAPI = analyticsAPI;
window.plansAPI = plansAPI;
window.paymentAPI = paymentAPI;
window.aiAPI = aiAPI;
