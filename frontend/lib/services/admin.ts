import api from '../api'

export async function setSponsor(userId: string, sponsorId: string) {
    const res = await api.patch(`/api/admin/users/${userId}/set-sponsor`, { sponsorId })
    return res.data
}

export async function adminProducts() {
    const res = await api.get('/api/admin/products')
    return res.data
}
