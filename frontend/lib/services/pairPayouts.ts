import api from '../api'

export async function getMyPayouts() {
    const res = await api.get('/api/pair-payouts/me')
    return res.data
}
