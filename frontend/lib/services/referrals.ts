import api from '../api'

export async function getMyTree(depth = 6) {
    const res = await api.get(`/api/referrals/me?depth=${depth}`)
    return res.data
}
