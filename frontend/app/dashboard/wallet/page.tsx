"use client"
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import DashboardLayout from '@/components/DashboardLayout'
import { me } from '@/lib/services/auth'
import { getWallet } from '@/lib/services/users'
import { getTransactions } from '@/lib/services/dashboard'
import AnimateOnScroll from '@/components/AnimateOnScroll'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card"
import { Input } from "@/components/ui/Input"
import { Button } from "@/components/ui/Button"
import toast from 'react-hot-toast'
import api from '@/lib/api'
import { SkeletonCard, SkeletonTable } from "@/components/ui/SkeletonCard"
import { formatIndian } from '@/lib/formatIndian'

interface Transaction {
    id: string
    type: string
    amount: number
    createdAt: string
    detail?: string
}

interface Withdrawal {
    id: string
    amount: number
    status: string
    createdAt: string
    cfStatus?: string
    cfTransferId?: string
}

interface Pagination {
    page: number
    limit: number
    total: number
    totalPages: number
    hasNext: boolean
    hasPrev: boolean
}

export default function Wallet() {
    const router = useRouter()
    const [user, setUser] = useState<{ id?: string; username?: string; email?: string; phone?: string } | null>(null)
    const [balance, setBalance] = useState(0)

    // Withdrawals State
    const [withdrawals, setWithdrawals] = useState<Withdrawal[]>([])
    const [withdrawalsMeta, setWithdrawalsMeta] = useState<Pagination | null>(null)
    const [withdrawalPage, setWithdrawalPage] = useState(1)

    // Transactions State
    const [transactions, setTransactions] = useState<Transaction[]>([])
    const [transactionsMeta, setTransactionsMeta] = useState<Pagination | null>(null)
    const [transactionPage, setTransactionPage] = useState(1)

    const [loading, setLoading] = useState(true)

    // Withdrawal Form State
    const [isWithdrawing, setIsWithdrawing] = useState(false)
    const [withdrawAmount, setWithdrawAmount] = useState('')
    const [paymentMode, setPaymentMode] = useState<'BANK' | 'UPI'>('BANK')
    const [vpa, setVpa] = useState('')
    const [bankDetails, setBankDetails] = useState({
        accountNumber: '',
        ifsc: '',
        holderName: ''
    })

    const fetchWallet = async (userId: string) => {
        const res = await getWallet(userId)
        setBalance(res.wallet?.balance || 0)
    }

    const fetchWithdrawals = async (page = 1) => {
        try {
            const res = await api.get('/api/payouts/my-list', { params: { page, limit: 10 } })
            setWithdrawals(res.data.withdrawals || [])
            setWithdrawalsMeta(res.data.pagination)
        } catch (error) {
            console.error('Failed to fetch withdrawals', error)
        }
    }

    const fetchTransactions = async (page = 1) => {
        try {
            const res = await getTransactions({ page, limit: 10 })
            setTransactions(res.transactions || [])
            setTransactionsMeta(res.pagination)
        } catch (error) {
            console.error('Failed to fetch transactions', error)
        }
    }

    const loadData = async () => {
        try {
            const token = localStorage.getItem('accessToken')
            if (!token) { router.push('/login'); return }

            const userRes = await me()
            const userData = userRes?.user || userRes
            setUser(userData)

            if (userData?.id) {
                await Promise.all([
                    fetchWallet(userData.id),
                    fetchWithdrawals(1),
                    fetchTransactions(1)
                ])
            }
        } catch (e) {
            console.error(e)
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        loadData()
    }, [router])

    useEffect(() => {
        if (withdrawalPage > 1) fetchWithdrawals(withdrawalPage)
    }, [withdrawalPage])

    useEffect(() => {
        if (transactionPage > 1) fetchTransactions(transactionPage)
    }, [transactionPage])


    const handleWithdraw = async (e: React.FormEvent) => {
        e.preventDefault()

        if (new Date().getDay() !== 1) {
            toast.error('Withdrawals can only be requested on Mondays')
            return
        }

        const amount = Number(withdrawAmount)

        if (amount < 1000) {
            toast.error('Minimum withdrawal is ₹1000')
            return
        }
        if (amount > balance) {
            toast.error('Insufficient balance')
            return
        }

        if (paymentMode === 'UPI') {
            if (!vpa || !vpa.includes('@')) {
                toast.error('Enter valid UPI ID')
                return
            }
            if (!bankDetails.holderName) {
                toast.error('Enter Name')
                return
            }
        } else {
            if (!bankDetails.accountNumber || !bankDetails.ifsc || !bankDetails.holderName) {
                toast.error('Please fill all bank details')
                return
            }
        }

        setIsWithdrawing(true)
        try {
            const payload = {
                amount,
                bankDetails: {
                    name: bankDetails.holderName,
                    email: user?.email,
                    phone: user?.phone,
                    ...(paymentMode === 'UPI' ? { vpa } : {
                        accountInfo: {
                            bankAccount: bankDetails.accountNumber,
                            ifsc: bankDetails.ifsc
                        }
                    })
                }
            }
            await api.post('/api/payouts/request', payload)
            toast.success('Withdrawal requested successfully')
            setWithdrawAmount('')
            if (user?.id) fetchWallet(user.id)
            setWithdrawalPage(1)
            fetchWithdrawals(1)
        } catch (err: any) {
            toast.error(err.response?.data?.error || 'Withdrawal failed')
        } finally {
            setIsWithdrawing(false)
        }
    }

    const checkStatus = async (id: string) => {
        const toastId = toast.loading('Checking status...')
        try {
            const res = await api.post(`/api/payouts/status/${id}`)
            toast.success(`Status updated: ${res.data.status}`, { id: toastId })
            fetchWithdrawals(withdrawalPage)
        } catch (err: any) {
            toast.error(err.response?.data?.error || 'Failed to check status', { id: toastId })
        }
    }

    return (
        <DashboardLayout user={user}>
            {loading ? (
                <div className="container mx-auto px-2 sm:px-3 lg:px-6 py-10 space-y-10">
                    {/* Header Skeleton */}
                    <div className="space-y-2">
                        <div className="h-8 bg-gray-200 rounded w-1/4 animate-pulse"></div>
                        <div className="h-4 bg-gray-200 rounded w-1/6 animate-pulse"></div>
                    </div>

                    <div className="grid lg:grid-cols-3 gap-8">
                        {/* Left Column Skeleton */}
                        <div className="lg:col-span-1 space-y-6">
                            <SkeletonCard className="h-40 bg-white p-6 rounded-2xl border border-gray-100" />
                            <SkeletonCard className="h-64 bg-white p-6 rounded-2xl border border-gray-100" />
                        </div>

                        {/* Right Column Skeleton */}
                        <div className="lg:col-span-2 space-y-6">
                            <div className="bg-white rounded-2xl border border-gray-100 p-6">
                                <div className="h-6 bg-gray-200 rounded w-1/4 animate-pulse mb-6"></div>
                                <SkeletonTable rows={5} />
                            </div>
                            <div className="bg-white rounded-2xl border border-gray-100 p-6">
                                <div className="h-6 bg-gray-200 rounded w-1/4 animate-pulse mb-6"></div>
                                <SkeletonTable rows={5} />
                            </div>
                        </div>
                    </div>
                </div>
            ) : (
                <>
                    {/* Header */}
                    <AnimateOnScroll animation="fade-up">
                        <div className="mb-8">
                            <h1 className="text-3xl font-light text-gray-900 tracking-tight">Wallet</h1>
                            <p className="text-gray-500 mt-1">Manage balance and withdrawals</p>
                        </div>
                    </AnimateOnScroll>

                    <div className="grid lg:grid-cols-3 gap-8">
                        {/* LEFT COLUMN: Balance & Withdraw Form */}
                        <div className="lg:col-span-1 space-y-6">
                            <AnimateOnScroll animation="fade-up" delay={100}>
                                <div className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-2xl p-6 text-white shadow-xl">
                                    <p className="text-sm font-medium text-gray-300 uppercase tracking-wider mb-1">Available Balance</p>
                                    <p className="text-4xl font-light mb-4 text-white">₹{balance.toLocaleString()}</p>
                                    <div className="text-xs text-gray-400 flex items-center gap-1">
                                        <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                                        Ready for withdrawal
                                    </div>
                                </div>
                            </AnimateOnScroll>

                            <AnimateOnScroll animation="fade-up" delay={200}>
                                <Card className="border-gray-100 shadow-lg">
                                    <CardHeader className="pb-3 border-b border-gray-50">
                                        <CardTitle className="text-lg">Request Withdrawal</CardTitle>
                                    </CardHeader>
                                    <CardContent className="pt-4">
                                        <form onSubmit={handleWithdraw} className="space-y-4">
                                            {/* Payment Mode */}
                                            <div className="grid grid-cols-2 gap-2 bg-gray-50 p-1 rounded-lg">
                                                <button
                                                    type="button"
                                                    onClick={() => setPaymentMode('BANK')}
                                                    className={`py-2 text-xs font-medium rounded-md transition-all ${paymentMode === 'BANK' ? 'bg-white text-gray-900 shadow-sm ring-1 ring-gray-200' : 'text-gray-500 hover:text-gray-900'}`}
                                                >
                                                    Bank Transfer
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() => setPaymentMode('UPI')}
                                                    className={`py-2 text-xs font-medium rounded-md transition-all ${paymentMode === 'UPI' ? 'bg-white text-gray-900 shadow-sm ring-1 ring-gray-200' : 'text-gray-500 hover:text-gray-900'}`}
                                                >
                                                    UPI Transfer
                                                </button>
                                            </div>

                                            <div className="space-y-3">
                                                <Input
                                                    placeholder="Account Holder Name"
                                                    value={bankDetails.holderName}
                                                    onChange={e => setBankDetails(p => ({ ...p, holderName: e.target.value }))}
                                                    required
                                                    className="bg-transparent"
                                                />
                                                {paymentMode === 'BANK' ? (
                                                    <div className="grid grid-cols-2 gap-2">
                                                        <Input
                                                            placeholder="IFSC Code"
                                                            value={bankDetails.ifsc}
                                                            onChange={e => setBankDetails(p => ({ ...p, ifsc: e.target.value.toUpperCase() }))}
                                                            required
                                                            className="uppercase bg-transparent"
                                                        />
                                                        <Input
                                                            placeholder="Account No"
                                                            value={bankDetails.accountNumber}
                                                            onChange={e => setBankDetails(p => ({ ...p, accountNumber: e.target.value }))}
                                                            required
                                                            className="bg-transparent"
                                                            type="password"
                                                        />
                                                    </div>
                                                ) : (
                                                    <Input
                                                        placeholder="UPI ID (e.g. user@okhdfc)"
                                                        value={vpa}
                                                        onChange={e => setVpa(e.target.value)}
                                                        required
                                                        className="bg-transparent"
                                                    />
                                                )}
                                            </div>

                                            <div className="flex gap-2">
                                                <div className="relative flex-1">
                                                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 text-sm">₹</span>
                                                    <Input
                                                        type="number"
                                                        placeholder="Amount"
                                                        value={withdrawAmount}
                                                        onChange={e => setWithdrawAmount(e.target.value)}
                                                        className="pl-7 bg-transparent"
                                                        min={1000}
                                                        required
                                                    />
                                                </div>
                                                <Button type="submit" disabled={isWithdrawing || balance < 1000} className="bg-gray-900 hover:bg-gray-800 text-white">
                                                    {isWithdrawing ? '...' : 'Withdraw'}
                                                </Button>
                                            </div>
                                            <p className="text-[10px] text-gray-400 text-center">Min ₹1,000. 24-48 hrs processing. Available on Mondays only.</p>
                                        </form>
                                    </CardContent>
                                </Card>
                            </AnimateOnScroll>
                        </div>

                        {/* RIGHT COLUMN: Withdrawals & Transactions */}
                        <div className="lg:col-span-2 space-y-6">

                            {/* Withdrawals List */}
                            <AnimateOnScroll animation="fade-up" delay={300}>
                                <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm">
                                    <div className="p-6 border-b border-gray-100 flex justify-between items-center">
                                        <h2 className="text-lg font-medium text-gray-900">Withdrawals</h2>
                                        <Button variant="ghost" size="sm" onClick={() => fetchWithdrawals(withdrawalPage)} className="h-8 text-xs">Refresh</Button>
                                    </div>
                                    <div className="divide-y divide-gray-100 max-h-[500px] overflow-y-auto">
                                        {withdrawals.length > 0 ? withdrawals.map((w) => (
                                            <div key={w.id} className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-gray-50 transition">
                                                <div>
                                                    <div className="flex items-center gap-2">
                                                        <span className="font-medium text-gray-900">₹{w.amount.toLocaleString()}</span>
                                                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${w.status === 'COMPLETED' ? 'bg-green-100 text-green-700' :
                                                            w.status === 'APPROVED' ? 'bg-blue-50 text-blue-700 border border-blue-100' :
                                                                w.status === 'REJECTED' ? 'bg-red-100 text-red-700' :
                                                                    'bg-yellow-100 text-yellow-700'
                                                            }`}>
                                                            {w.status === 'APPROVED' ? 'PROCESSING' : w.status}
                                                        </span>
                                                        {w.cfStatus && (
                                                            <span className="text-[10px] text-gray-500 bg-gray-100 px-1.5 py-0.5 rounded border border-gray-200">
                                                                {w.cfStatus}
                                                            </span>
                                                        )}
                                                    </div>
                                                    <p className="text-xs text-gray-500 mt-1">{new Date(w.createdAt).toLocaleString()}</p>
                                                    {w.cfTransferId && <p className="text-[10px] text-gray-400 font-mono mt-0.5">Ref: {w.cfTransferId}</p>}
                                                </div>

                                                {w.status === 'APPROVED' && (
                                                    <Button
                                                        size="sm"
                                                        variant="outline"
                                                        className="text-xs h-7"
                                                        onClick={() => checkStatus(w.id)}
                                                    >
                                                        Check Status
                                                    </Button>
                                                )}
                                            </div>
                                        )) : (
                                            <div className="p-8 text-center text-gray-400 text-sm">No withdrawals found.</div>
                                        )}
                                    </div>
                                    {/* Withdrawals Pagination */}
                                    {withdrawalsMeta && withdrawalsMeta.totalPages > 1 && (
                                        <div className="px-6 py-3 border-t border-gray-100 flex items-center justify-between bg-gray-50">
                                            <div className="flex gap-2">
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    className="h-7 text-xs"
                                                    disabled={!withdrawalsMeta.hasPrev}
                                                    onClick={() => setWithdrawalPage(p => p - 1)}
                                                >
                                                    Prev
                                                </Button>
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    className="h-7 text-xs"
                                                    disabled={!withdrawalsMeta.hasNext}
                                                    onClick={() => setWithdrawalPage(p => p + 1)}
                                                >
                                                    Next
                                                </Button>
                                            </div>
                                            <span className="text-xs text-gray-500">Page {withdrawalsMeta.page} of {withdrawalsMeta.totalPages}</span>
                                        </div>
                                    )}
                                </div>
                            </AnimateOnScroll>

                            {/* Transaction Ledger */}
                            <AnimateOnScroll animation="fade-up" delay={400}>
                                <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm">
                                    <div className="p-6 border-b border-gray-100">
                                        <h2 className="text-lg font-medium text-gray-900">Transaction History</h2>
                                    </div>
                                    <div className="max-h-[500px] overflow-y-auto divide-y divide-gray-100">
                                        {transactions.length > 0 ? transactions.map((tx) => {
                                            const isCredit = tx.type.includes('BONUS') || tx.type.includes('REFUND') || tx.type === 'ADMIN_CREDIT'
                                            return (
                                                <div key={tx.id} className="p-4 flex items-center justify-between hover:bg-gray-50">
                                                    <div className="flex items-center gap-3">
                                                        <div className={`w-8 h-8 rounded-full flex items-center justify-center ${isCredit ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-600'}`}>
                                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={isCredit ? 'M7 11l5-5m0 0l5 5m-5-5v12' : 'M17 13l-5 5m0 0l-5-5m5 5V6'} />
                                                            </svg>
                                                        </div>
                                                        <div>
                                                            <p className="text-sm font-medium text-gray-900">{tx.type.replace(/_/g, ' ')}</p>
                                                            <p className="text-xs text-gray-500">{new Date(tx.createdAt).toLocaleDateString()}</p>
                                                        </div>
                                                    </div>
                                                    <div className="text-right">
                                                        <p className={`text-sm font-medium ${isCredit ? 'text-emerald-600' : 'text-red-600'}`}>
                                                            {isCredit ? '+' : '-'}₹{Math.abs(tx.amount).toLocaleString()}
                                                        </p>
                                                    </div>
                                                </div>
                                            )
                                        }) : (
                                            <div className="p-8 text-center text-gray-400 text-sm">No transactions yet.</div>
                                        )}
                                    </div>
                                    {/* Transactions Pagination */}
                                    {transactionsMeta && transactionsMeta.totalPages > 1 && (
                                        <div className="px-6 py-3 border-t border-gray-100 flex items-center justify-between bg-gray-50">
                                            <div className="flex gap-2">
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    className="h-7 text-xs"
                                                    disabled={!transactionsMeta.hasPrev}
                                                    onClick={() => setTransactionPage(p => p - 1)}
                                                >
                                                    Prev
                                                </Button>
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    className="h-7 text-xs"
                                                    disabled={!transactionsMeta.hasNext}
                                                    onClick={() => setTransactionPage(p => p + 1)}
                                                >
                                                    Next
                                                </Button>
                                            </div>
                                            <span className="text-xs text-gray-500">Page {transactionsMeta.page} of {transactionsMeta.totalPages}</span>
                                        </div>
                                    )}
                                </div>
                            </AnimateOnScroll>

                        </div>
                    </div>
                </>
            )}
        </DashboardLayout>
    )
}
