import api from '../api'

export async function listPublic() {
    const res = await api.get('/api/public/products')
    return res.data
}

export async function purchase(productId: string) {
    const res = await api.post(`/api/products/${productId}/purchase`)
    return res.data
}
