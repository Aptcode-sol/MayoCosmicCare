import api from '../api'

export async function getWallet(userId: string) {
    const res = await api.get(`/api/users/${userId}/wallet`)
    return res.data
}

export async function getMyReferrals(depth = 4) {
    const res = await api.get(`/api/referrals/me?depth=${depth}`)
    return res.data
}

export async function getUser(userId: string) {
    const res = await api.get(`/api/users/${userId}`)
    return res.data
}
