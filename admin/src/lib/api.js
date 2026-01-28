import axios from 'axios';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:4000';

const api = axios.create({
    baseURL: API_BASE,
    headers: {
        'Content-Type': 'application/json'
    }
});

// Helper to clear admin auth and redirect
function clearAdminAuthAndRedirect() {
    localStorage.removeItem('adminAccessToken');
    localStorage.removeItem('adminRefreshToken');
    // Only redirect if not already on login page to prevent redirect loop
    if (typeof window !== 'undefined' && window.location.pathname !== '/') {
        window.location.href = '/';
    }
}

// Add auth token to requests
api.interceptors.request.use((config) => {
    const token = localStorage.getItem('adminAccessToken');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

// Handle token refresh or logout on auth errors
api.interceptors.response.use(
    (response) => response,
    async (error) => {
        const status = error.response?.status;
        const responseData = error.response?.data;

        // Handle 401, 403, or user-specific errors
        if (status === 401) {
            // Clear tokens and redirect to login
            clearAdminAuthAndRedirect();
            return Promise.reject(error);
        }

        // Handle 403 (Forbidden) or specific error messages
        if (status === 403) {
            const errorMsg = responseData?.error || responseData?.message || '';
            if (
                errorMsg.toLowerCase().includes('not authorized') ||
                errorMsg.toLowerCase().includes('admin') ||
                errorMsg.toLowerCase().includes('forbidden')
            ) {
                clearAdminAuthAndRedirect();
                return Promise.reject(error);
            }
        }

        // Handle 404 user not found
        if (status === 404) {
            const errorMsg = responseData?.error || responseData?.message || '';
            if (errorMsg.toLowerCase().includes('user not found')) {
                clearAdminAuthAndRedirect();
                return Promise.reject(error);
            }
        }

        return Promise.reject(error);
    }
);

export default api;
