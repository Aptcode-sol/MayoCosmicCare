import api from '../api'

export async function login(payload: { email: string, password: string }) {
    const res = await api.post('/api/auth/login', payload)
    const data = res.data || {}
    // Support both { accessToken, refreshToken } and { tokens: { accessToken, refreshToken } }
    const tokens = data.tokens || data
    return {
        ...data,
        accessToken: tokens.accessToken,
        refreshToken: tokens.refreshToken,
    }
}

export async function register(payload: Record<string, unknown>) {
    const res = await api.post('/api/auth/register', payload)
    return res.data
}

export async function me() {
    const res = await api.get('/api/auth/me')
    return res.data
}

export async function refresh() {
    const res = await api.post('/api/auth/refresh')
    return res.data
}

export async function requestReset(email: string) {
    const res = await api.post('/api/auth/request-reset', { email })
    return res.data
}

export async function resetPassword(token: string, newPassword: string) {
    const res = await api.post('/api/auth/reset-password', { token, newPassword })
    return res.data
}

export async function sendOtp(email: string) {
    const res = await api.post('/api/auth/send-otp', { email })
    return res.data
}

export async function verifyOtp(email: string, otp: string) {
    const res = await api.post('/api/auth/verify-otp', { email, otp })
    return res.data
}
