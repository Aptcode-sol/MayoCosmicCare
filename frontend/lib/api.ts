import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

const api = axios.create({
    baseURL: API_URL,
    headers: {
        'Content-Type': 'application/json'
    }
});

// Add auth token to requests
api.interceptors.request.use((config) => {
    const token = localStorage.getItem('accessToken');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

// Centralized error normalization helper
export function parseApiError(err: any) {
    const status = err?.response?.status || null
    const data = err?.response?.data || null
    const message = data?.error || data?.message || err?.message || 'An unknown error occurred'
    return { message, status, data, code: err?.code || null }
}

// Handle token refresh on 401 and normalize errors
api.interceptors.response.use(
    (response) => response,
    async (error) => {
        const originalRequest = error.config;

        if (error.response?.status === 401 && !originalRequest._retry) {
            originalRequest._retry = true;

            const refreshToken = localStorage.getItem('refreshToken');
            if (refreshToken) {
                try {
                    const { data } = await axios.post(`${API_URL}/api/auth/refresh`, {
                        refresh: refreshToken
                    });

                    localStorage.setItem('accessToken', data.tokens.accessToken);
                    localStorage.setItem('refreshToken', data.tokens.refreshToken);

                    originalRequest.headers.Authorization = `Bearer ${data.tokens.accessToken}`;
                    return api(originalRequest);
                } catch (err) {
                    localStorage.removeItem('accessToken');
                    localStorage.removeItem('refreshToken');
                    window.location.href = '/login';
                    return Promise.reject(parseApiError(err));
                }
            }
        }

        return Promise.reject(parseApiError(error));
    }
);

export default api;
