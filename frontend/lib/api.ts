import axios, { AxiosRequestConfig, AxiosError } from 'axios';

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
        if (config.headers) {
            // @ts-ignore
            config.headers['Authorization'] = `Bearer ${token}`;
        } else {
            // @ts-ignore
            config.headers = { Authorization: `Bearer ${token}` };
        }
    }
    return config;
});

// Centralized error normalization helper
export function parseApiError(err: unknown) {
    if (axios.isAxiosError(err)) {
        const status = err.response?.status ?? null
        const data = err.response?.data ?? null
        const message = (data && (data.error || data.message)) || err.message || 'An unknown error occurred'
        return { message: String(message), status, data, code: err.code ?? null }
    }

    const message = err instanceof Error ? err.message :
        (typeof err === 'object' && err !== null && 'message' in err) ? String((err as any).message) :
            String(err)
    return { message, status: null, data: null, code: null }
}

// Handle token refresh on 401 and normalize errors
api.interceptors.response.use(
    (response) => response,
    async (error: unknown) => {
        const axiosErr = axios.isAxiosError(error) ? error as AxiosError : null
        const originalRequest = axiosErr?.config as (AxiosRequestConfig & { _retry?: boolean }) | undefined

        if (axiosErr?.response?.status === 401 && originalRequest && !originalRequest._retry) {
            originalRequest._retry = true;

            const refreshToken = localStorage.getItem('refreshToken');
            if (refreshToken) {
                try {
                    const resp = await axios.post(`${API_URL}/api/auth/refresh`, {
                        refresh: refreshToken
                    });
                    const d = resp.data || {}
                    const tokens = d.tokens || d

                    if (tokens.accessToken && tokens.refreshToken) {
                        localStorage.setItem('accessToken', tokens.accessToken);
                        localStorage.setItem('refreshToken', tokens.refreshToken);

                        // @ts-ignore
                        originalRequest.headers['Authorization'] = `Bearer ${tokens.accessToken}`
                        return api(originalRequest as AxiosRequestConfig);
                    } else {
                        console.warn('Refresh endpoint returned no tokens', d)
                        // fall through to failure branch
                    }
                } catch (err: unknown) {
                    console.debug('Token refresh failed', err)
                    localStorage.removeItem('accessToken');
                    localStorage.removeItem('refreshToken');
                    try {
                        // prefer client-side navigation if router is available
                        window.location.assign('/login')
                    } catch {
                        window.location.href = '/login'
                    }
                    return Promise.reject(parseApiError(err));
                }
            }
        }

        return Promise.reject(parseApiError(error));
    }
);

export default api;
