import axios from 'axios';

const api = axios.create({
    baseURL: import.meta.env.VITE_API_URL || '/api',
});

api.interceptors.request.use((config) => {
    const token = sessionStorage.getItem('token');
    const spaceToken = sessionStorage.getItem('spaceToken');

    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    if (spaceToken) {
        config.headers['X-Space-Authorization'] = spaceToken;
    }
    return config;
});

export default api;
