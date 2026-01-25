import api from '../api'

export async function listPublic() {
    const res = await api.get('/api/public/products')
    return res.data
}

export async function purchase(productId: string, sponsorId?: string, leg?: 'left' | 'right') {
    const res = await api.post(`/api/products/${productId}/purchase`, { sponsorId, leg })
    return res.data
}
