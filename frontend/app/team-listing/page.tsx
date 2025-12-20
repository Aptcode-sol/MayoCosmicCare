"use client"
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import DashboardLayout from '@/components/DashboardLayout'
import { me } from '@/lib/services/auth'

// Hardcoded data for UI development
const mockMembers = [
    { id: '1', name: 'Amit Kumar', introducer: 'You', team: 'Left', sponsor: 'You', joinDate: '2024-12-15', status: 'Active', totalBV: 5000, rangeBV: 2000 },
    { id: '2', name: 'Priya Singh', introducer: 'Amit Kumar', team: 'Left', sponsor: 'Amit Kumar', joinDate: '2024-12-14', status: 'Active', totalBV: 3500, rangeBV: 1500 },
    { id: '3', name: 'Rahul Sharma', introducer: 'You', team: 'Right', sponsor: 'You', joinDate: '2024-12-12', status: 'Active', totalBV: 4200, rangeBV: 1800 },
    { id: '4', name: 'Sneha Patel', introducer: 'Priya Singh', team: 'Left', sponsor: 'Priya Singh', joinDate: '2024-12-10', status: 'Inactive', totalBV: 2000, rangeBV: 0 },
    { id: '5', name: 'Vikash Gupta', introducer: 'Rahul Sharma', team: 'Right', sponsor: 'Rahul Sharma', joinDate: '2024-12-08', status: 'Active', totalBV: 2800, rangeBV: 1200 },
    { id: '6', name: 'Neha Verma', introducer: 'You', team: 'Left', sponsor: 'You', joinDate: '2024-12-05', status: 'Active', totalBV: 3000, rangeBV: 800 },
    { id: '7', name: 'Ravi Joshi', introducer: 'Vikash Gupta', team: 'Right', sponsor: 'Vikash Gupta', joinDate: '2024-12-01', status: 'Pending', totalBV: 0, rangeBV: 0 },
    { id: '8', name: 'Anita Rani', introducer: 'Neha Verma', team: 'Left', sponsor: 'Neha Verma', joinDate: '2024-11-28', status: 'Active', totalBV: 4500, rangeBV: 600 },
]

export default function TeamListing() {
    const router = useRouter()
    const [user, setUser] = useState<{ username?: string; email?: string } | null>(null)
    const [loading, setLoading] = useState(true)
    const [search, setSearch] = useState('')
    const [fromDate, setFromDate] = useState('')
    const [toDate, setToDate] = useState('')
    const [teamFilter, setTeamFilter] = useState<'all' | 'left' | 'right'>('all')

    useEffect(() => {
        const loadUser = async () => {
            try {
                const token = localStorage.getItem('accessToken')
                if (!token) { router.push('/login'); return }
                const res = await me()
                setUser(res?.user || res)
            } catch { router.push('/login') }
            finally { setLoading(false) }
        }
        loadUser()
    }, [router])

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50 pt-20">
                <div className="w-8 h-8 border-2 border-gray-900 border-t-transparent rounded-full animate-spin" />
            </div>
        )
    }

    const filteredMembers = mockMembers.filter(m => {
        const matchesSearch = m.name.toLowerCase().includes(search.toLowerCase())
        const matchesTeam = teamFilter === 'all' || m.team.toLowerCase() === teamFilter
        return matchesSearch && matchesTeam
    })

    return (
        <DashboardLayout user={user}>
            {/* Page Header */}
            <div className="mb-8">
                <h1 className="text-3xl font-light text-gray-900 tracking-tight">Team Listing</h1>
                <p className="text-gray-500 mt-1">View and filter your team members</p>
            </div>

            {/* Filters */}
            <div className="bg-white rounded-2xl p-6 border border-gray-100 mb-8">
                <div className="grid md:grid-cols-4 gap-4">
                    {/* Search */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Search</label>
                        <input
                            type="text"
                            placeholder="Search by name..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:ring-2 focus:ring-gray-900 focus:border-transparent outline-none transition"
                        />
                    </div>

                    {/* From Date */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">From Date</label>
                        <input
                            type="date"
                            value={fromDate}
                            onChange={(e) => setFromDate(e.target.value)}
                            className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:ring-2 focus:ring-gray-900 focus:border-transparent outline-none transition"
                        />
                    </div>

                    {/* To Date */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">To Date</label>
                        <input
                            type="date"
                            value={toDate}
                            onChange={(e) => setToDate(e.target.value)}
                            className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:ring-2 focus:ring-gray-900 focus:border-transparent outline-none transition"
                        />
                    </div>

                    {/* Team Filter */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Team</label>
                        <select
                            value={teamFilter}
                            onChange={(e) => setTeamFilter(e.target.value as 'all' | 'left' | 'right')}
                            className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:ring-2 focus:ring-gray-900 focus:border-transparent outline-none transition"
                        >
                            <option value="all">All Teams</option>
                            <option value="left">Left Leg</option>
                            <option value="right">Right Leg</option>
                        </select>
                    </div>
                </div>
            </div>

            {/* Members Table */}
            <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full min-w-[900px]">
                        <thead>
                            <tr className="bg-gray-50 border-b border-gray-100">
                                <th className="text-left px-6 py-4 text-sm font-medium text-gray-500 uppercase tracking-wider">Name</th>
                                <th className="text-left px-6 py-4 text-sm font-medium text-gray-500 uppercase tracking-wider">Introducer</th>
                                <th className="text-left px-6 py-4 text-sm font-medium text-gray-500 uppercase tracking-wider">Team</th>
                                <th className="text-left px-6 py-4 text-sm font-medium text-gray-500 uppercase tracking-wider">Sponsor</th>
                                <th className="text-left px-6 py-4 text-sm font-medium text-gray-500 uppercase tracking-wider">Join Date</th>
                                <th className="text-left px-6 py-4 text-sm font-medium text-gray-500 uppercase tracking-wider">Status</th>
                                <th className="text-right px-6 py-4 text-sm font-medium text-gray-500 uppercase tracking-wider">Total BV</th>
                                <th className="text-right px-6 py-4 text-sm font-medium text-gray-500 uppercase tracking-wider">BV in Range</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {filteredMembers.map((member) => (
                                <tr key={member.id} className="hover:bg-gray-50 transition-colors">
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-sm font-medium text-gray-600">
                                                {member.name.split(' ').map(n => n[0]).join('')}
                                            </div>
                                            <span className="text-sm font-medium text-gray-900">{member.name}</span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-sm text-gray-600">{member.introducer}</td>
                                    <td className="px-6 py-4">
                                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${member.team === 'Left'
                                                ? 'bg-indigo-50 text-indigo-700'
                                                : 'bg-pink-50 text-pink-700'
                                            }`}>
                                            <span className={`w-1.5 h-1.5 rounded-full ${member.team === 'Left' ? 'bg-indigo-500' : 'bg-pink-500'}`} />
                                            {member.team}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-sm text-gray-600">{member.sponsor}</td>
                                    <td className="px-6 py-4 text-sm text-gray-600">{new Date(member.joinDate).toLocaleDateString()}</td>
                                    <td className="px-6 py-4">
                                        <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-medium ${member.status === 'Active'
                                                ? 'bg-emerald-50 text-emerald-700'
                                                : member.status === 'Pending'
                                                    ? 'bg-amber-50 text-amber-700'
                                                    : 'bg-gray-100 text-gray-600'
                                            }`}>
                                            {member.status}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-sm font-medium text-gray-900 text-right">₹{member.totalBV.toLocaleString()}</td>
                                    <td className="px-6 py-4 text-sm text-gray-600 text-right">₹{member.rangeBV.toLocaleString()}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {/* Pagination placeholder */}
                <div className="px-6 py-4 border-t border-gray-100 flex items-center justify-between">
                    <p className="text-sm text-gray-500">Showing {filteredMembers.length} of {mockMembers.length} members</p>
                    <div className="flex gap-2">
                        <button className="px-4 py-2 text-sm font-medium text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 transition">Previous</button>
                        <button className="px-4 py-2 text-sm font-medium text-white bg-gray-900 rounded-lg hover:bg-gray-800 transition">Next</button>
                    </div>
                </div>
            </div>
        </DashboardLayout>
    )
}
