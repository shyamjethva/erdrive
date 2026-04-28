import axios from 'axios';

const api = axios.create({
    baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api',
});

api.interceptors.request.use((config) => {
    const token = localStorage.getItem('token');
    const spaceToken = localStorage.getItem('spaceToken');

    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    if (spaceToken) {
        config.headers['X-Space-Authorization'] = spaceToken;
    }
    return config;
});

export default api;
