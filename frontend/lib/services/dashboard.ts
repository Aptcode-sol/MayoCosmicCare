import api from '../api'

export interface TeamStats {
    totalTeam: {
        leftMembers: number
        rightMembers: number
        leftBV: number
        rightBV: number
        activeLeft: number
        activeRight: number
        leftPaidBV: number
        rightPaidBV: number
    }
    directTeam: {
        total: number
        left: number
        right: number
        activeTotal: number
        activeLeft: number
        activeRight: number
    }
    carryForward: {
        left: number
        right: number
    }
}

export async function getTeamStats() {
    const res = await api.get('/api/dashboard/stats')
    return res.data.stats as TeamStats
}

export async function getIncentives(page = 1, limit = 20) {
    const res = await api.get('/api/dashboard/incentives', { params: { page, limit } })
    return res.data.data
}

export async function getTeamList(params: { search?: string, from?: string, to?: string }) {
    const res = await api.get('/api/dashboard/team', { params })
    return res.data
}

export async function getMatchingReport(page = 1, limit = 20) {
    const res = await api.get('/api/dashboard/matching', { params: { page, limit } })
    return res.data
}

export interface TransactionParams {
    page?: number
    limit?: number
    type?: string
    from?: string
    to?: string
}

export async function getTransactions(params: TransactionParams = {}) {
    const res = await api.get('/api/dashboard/transactions', { params })
    return res.data
}
