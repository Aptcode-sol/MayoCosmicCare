"use client"
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import DashboardLayout from '@/components/DashboardLayout'
import { me } from '@/lib/services/auth'
import { getWallet } from '@/lib/services/users'
import toast from 'react-hot-toast'

interface Transaction {
    id: string
    type: string
    amount: number
    createdAt: string
    detail?: string
}

interface WalletData {
    wallet: { balance: number } | null
    transactions: Transaction[]
}

export default function Wallet() {
    const router = useRouter()
    const [user, setUser] = useState<{ id?: string; username?: string; email?: string } | null>(null)
    const [walletData, setWalletData] = useState<WalletData | null>(null)
    const [loading, setLoading] = useState(true)
    const [showWithdraw, setShowWithdraw] = useState(false)
    const [withdrawAmount, setWithdrawAmount] = useState('')

    useEffect(() => {
        const load = async () => {
            try {
                const token = localStorage.getItem('accessToken')
                if (!token) { router.push('/login'); return }

                const userRes = await me()
                const userData = userRes?.user || userRes
                setUser(userData)

                if (userData?.id) {
                    const walletRes = await getWallet(userData.id)
                    setWalletData(walletRes)
                }
            } catch (e) {
                console.error(e)
            } finally {
                setLoading(false)
            }
        }
        load()
    }, [router])

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50 pt-20">
                <div className="w-8 h-8 border-2 border-gray-900 border-t-transparent rounded-full animate-spin" />
            </div>
        )
    }

    const balance = walletData?.wallet?.balance || 0
    const transactions = walletData?.transactions || []

    const handleWithdraw = async () => {
        if (!withdrawAmount || Number(withdrawAmount) <= 0) {
            toast.error('Please enter a valid amount')
            return
        }
        if (Number(withdrawAmount) > balance) {
            toast.error('Insufficient balance')
            return
        }
        // TODO: Implement actual withdrawal API call
        toast.success('Withdrawal request submitted')
        setShowWithdraw(false)
        setWithdrawAmount('')
    }

    return (
        <DashboardLayout user={user}>
            {/* Page Header */}
            <div className="mb-8">
                <h1 className="text-3xl font-light text-gray-900 tracking-tight">Wallet</h1>
                <p className="text-gray-500 mt-1">Manage your balance and transactions</p>
            </div>

            {/* Balance Cards */}
            <div className="grid md:grid-cols-2 gap-6 mb-8">
                {/* Available Balance */}
                <div className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-2xl p-6 text-white">
                    <div className="flex items-center justify-between mb-6">
                        <div className="flex items-center gap-3">
                            <div className="w-12 h-12 bg-white/10 rounded-xl flex items-center justify-center">
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                                </svg>
                            </div>
                            <p className="text-sm font-medium text-gray-300 uppercase tracking-wider">Available Balance</p>
                        </div>
                    </div>
                    <p className="text-5xl font-light mb-2">₹{balance.toLocaleString()}</p>
                    <p className="text-sm text-gray-400">Ready for withdrawal</p>
                </div>

                {/* Stats Card */}
                <div className="bg-white rounded-2xl p-6 border border-gray-100">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="w-12 h-12 bg-emerald-50 rounded-xl flex items-center justify-center">
                            <svg className="w-6 h-6 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                        </div>
                        <p className="text-sm font-medium text-gray-500 uppercase tracking-wider">Total Transactions</p>
                    </div>
                    <p className="text-5xl font-light text-gray-900 mb-2">{transactions.length}</p>
                    <p className="text-sm text-gray-500">All time activity</p>
                </div>
            </div>

            {/* Actions */}
            <div className="bg-white rounded-2xl p-6 border border-gray-100 mb-8">
                <h2 className="text-lg font-medium text-gray-900 mb-4">Quick Actions</h2>
                <div className="flex flex-wrap gap-4">
                    <button
                        onClick={() => setShowWithdraw(true)}
                        className="px-6 py-3 bg-gray-900 text-white rounded-xl font-medium hover:bg-gray-800 transition flex items-center gap-2"
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                        </svg>
                        Request Withdrawal
                    </button>
                </div>
            </div>

            {/* Withdraw Modal */}
            {showWithdraw && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl p-6 w-full max-w-md">
                        <h3 className="text-xl font-medium text-gray-900 mb-4">Request Withdrawal</h3>
                        <div className="mb-4">
                            <label className="block text-sm font-medium text-gray-700 mb-2">Amount</label>
                            <input
                                type="number"
                                value={withdrawAmount}
                                onChange={(e) => setWithdrawAmount(e.target.value)}
                                placeholder="Enter amount"
                                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-gray-900 focus:border-transparent outline-none"
                            />
                            <p className="text-sm text-gray-500 mt-2">Available: ₹{balance.toLocaleString()}</p>
                        </div>
                        <div className="flex gap-3">
                            <button
                                onClick={() => setShowWithdraw(false)}
                                className="flex-1 px-4 py-3 bg-gray-100 text-gray-700 rounded-xl font-medium hover:bg-gray-200 transition"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleWithdraw}
                                className="flex-1 px-4 py-3 bg-gray-900 text-white rounded-xl font-medium hover:bg-gray-800 transition"
                            >
                                Submit Request
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Transaction History */}
            <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
                <div className="p-6 border-b border-gray-100">
                    <h2 className="text-lg font-medium text-gray-900">Transaction History</h2>
                </div>

                {transactions.length > 0 ? (
                    <div className="divide-y divide-gray-100">
                        {transactions.map((tx) => {
                            const isCredit = tx.type.includes('BONUS') || tx.type === 'ADMIN_CREDIT'
                            return (
                                <div key={tx.id} className="px-6 py-4 flex items-center justify-between hover:bg-gray-50 transition-colors">
                                    <div className="flex items-center gap-4">
                                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${isCredit ? 'bg-emerald-50' : 'bg-red-50'
                                            }`}>
                                            <svg className={`w-5 h-5 ${isCredit ? 'text-emerald-600' : 'text-red-600'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={isCredit ? 'M7 11l5-5m0 0l5 5m-5-5v12' : 'M17 13l-5 5m0 0l-5-5m5 5V6'} />
                                            </svg>
                                        </div>
                                        <div>
                                            <p className="font-medium text-gray-900">
                                                {tx.type.replace(/_/g, ' ')}
                                            </p>
                                            <p className="text-sm text-gray-500">
                                                {new Date(tx.createdAt).toLocaleDateString()}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <p className={`font-medium ${isCredit ? 'text-emerald-600' : 'text-red-600'}`}>
                                            {isCredit ? '+' : '-'}₹{Math.abs(tx.amount).toLocaleString()}
                                        </p>
                                        {tx.detail && <p className="text-xs text-gray-400 max-w-[150px] truncate">{tx.detail}</p>}
                                    </div>
                                </div>
                            )
                        })}
                    </div>
                ) : (
                    <div className="text-center py-12">
                        <p className="text-gray-500">No transactions yet</p>
                    </div>
                )}
            </div>
        </DashboardLayout>
    )
}
