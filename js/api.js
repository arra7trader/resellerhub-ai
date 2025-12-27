/**
 * ResellerHub AI - API Client
 * Updated for Vercel deployment
 */

// Auto-detect API URL based on environment
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
        try {
            const response = await fetch(url, config);
            const data = await response.json();
            if (!response.ok) throw new Error(data.error || 'Terjadi kesalahan');
            return data;
        } catch (error) {
            console.error('API Error:', error);
            throw error;
        }
    },

    get(endpoint) { return this.request(endpoint, { method: 'GET' }); },
    post(endpoint, body) { return this.request(endpoint, { method: 'POST', body }); },
    put(endpoint, body) { return this.request(endpoint, { method: 'PUT', body }); },
    delete(endpoint) { return this.request(endpoint, { method: 'DELETE' }); }
};

const authAPI = {
    async register(data) {
        const result = await api.post('/auth/register', data);
        if (result.token) {
            api.setToken(result.token);
            localStorage.setItem('resellerhub_user', JSON.stringify(result.user));
        }
        return result;
    },
    async login(email, password) {
        const result = await api.post('/auth/login', { email, password });
        if (result.token) {
            api.setToken(result.token);
            localStorage.setItem('resellerhub_user', JSON.stringify(result.user));
        }
        return result;
    },
    async getMe() { return api.get('/auth/me'); },
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
    getById(id) { return api.get(`/products/${id}`); },
    create(data) { return api.post('/products', data); },
    update(id, data) { return api.put(`/products/${id}`, data); },
    delete(id) { return api.delete(`/products/${id}`); }
};

const analyticsAPI = {
    getDashboard() { return api.get('/analytics/dashboard'); }
};

const plansAPI = {
    getAll() { return api.get('/plans'); }
};

const paymentAPI = {
    create(planId) { return api.post('/payment/create', { plan_id: planId }); },
    uploadProof(paymentId, proofUrl) {
        return api.post('/payment/confirm', {
            payment_id: paymentId,
            action: 'upload_proof',
            proof_url: proofUrl
        });
    },
    getMyPayments() { return api.get('/payment/confirm'); }
};

const aiAPI = {
    suggestPrice(product, competitorPrices = []) {
        return api.post('/ai/suggest', {
            action: 'price',
            data: { product, competitorPrices }
        });
    },
    generateDescription(product) {
        return api.post('/ai/suggest', {
            action: 'description',
            data: { product }
        });
    },
    getBusinessTips(context = {}) {
        return api.post('/ai/suggest', {
            action: 'tips',
            data: { context }
        });
    },
    analyzeTrends(products = []) {
        return api.post('/ai/suggest', {
            action: 'trends',
            data: { products }
        });
    },
    chat(message) {
        return api.post('/ai/suggest', {
            action: 'chat',
            data: { message }
        });
    }
};

// Export to window
window.api = api;
window.authAPI = authAPI;
window.productsAPI = productsAPI;
window.analyticsAPI = analyticsAPI;
window.plansAPI = plansAPI;
window.paymentAPI = paymentAPI;
window.aiAPI = aiAPI;
