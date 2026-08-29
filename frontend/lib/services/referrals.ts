import api from '../api'

export type NetworkPathEntry = {
    id: string
    username?: string
    name?: string
}

export type NetworkSearchMatch = {
    id: string
    username?: string
    name?: string
    position?: string
    path: NetworkPathEntry[]
}

export async function getMyTree(depth = 3) {
    const res = await api.get(`/api/referrals/me?depth=${depth}`)
    return res.data
}

export async function getTreeForUser(userId: string, depth = 3) {
    const res = await api.get(`/api/referrals/${userId}?depth=${depth}`)
    return res.data
}

export async function searchMyNetwork(q: string): Promise<{ ok: boolean; matches: NetworkSearchMatch[] }> {
    const res = await api.get(`/api/referrals/search?q=${encodeURIComponent(q)}`)
    return res.data
}
