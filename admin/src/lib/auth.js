import api from './api';

export const adminLogin = async (email, password) => {
    const res = await api.post('/api/auth/admin-login', { email, password });
    if (res.data.ok) {
        localStorage.setItem('adminAccessToken', res.data.tokens.accessToken);
        localStorage.setItem('adminRefreshToken', res.data.tokens.refreshToken);
    }
    return res.data;
};

export const adminLogout = () => {
    localStorage.removeItem('adminAccessToken');
    localStorage.removeItem('adminRefreshToken');
    window.location.href = '/';
};

export const isAuthenticated = () => {
    return !!localStorage.getItem('adminAccessToken');
};

export const getMe = async () => {
    const res = await api.get('/api/auth/me');
    return res.data;
};
