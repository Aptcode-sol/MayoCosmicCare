"use client"
import { useState, useEffect, useRef } from 'react'
import toast from 'react-hot-toast'
import { me } from '../../lib/services/auth'
import { getWallet } from '../../lib/services/users'
import { getMyPayouts } from '../../lib/services/pairPayouts'
import { useRouter } from 'next/navigation'

interface User {
    id: string
    username: string
    email: string
    role: string
    leftBV: number
    rightBV: number
    leftCarryBV: number
    rightCarryBV: number
}

interface Wallet {
    balance: number
}

interface Transaction {
    id: string
    type: string
    amount: number
    detail: string
    createdAt: string
}

interface PayoutRecord {
    id: string
    amount: number
    pairs?: number
    createdAt: string
    leftBv?: number
    rightBv?: number
    date?: string
}

interface Notification {
    id: string
    ts: number
    message: string
}

export default function Dashboard() {
    const router = useRouter();
    const [user, setUser] = useState<User | null>(null);
    const [wallet, setWallet] = useState<Wallet | null>(null);
    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const [payouts, setPayouts] = useState<PayoutRecord[]>([]);
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [loading, setLoading] = useState(true);
    const lastPayoutIdsRef = useRef<Set<string>>(new Set())

    // initial load and periodic payout polling
    useEffect(() => {
        let mounted = true
        const run = async () => {
            try {
                const token = localStorage.getItem('accessToken');
                if (!token) {
                    router.push('/login');
                    return;
                }

                // Fetch user
                const userRes = await me()
                if (!mounted) return
                setUser(userRes.user);

                // Fetch wallet and txs
                const walletRes = await getWallet(userRes.user.id)
                if (!mounted) return
                setWallet(walletRes.wallet);
                const txs = (walletRes.transactions || []).slice(0, 10);

                // Fetch recent pair payouts and merge
                try {
                    const payoutsRes = await getMyPayouts()
                    const payoutTxs: Transaction[] = (payoutsRes.records || []).map((p: PayoutRecord) => ({
                        id: p.id,
                        type: 'MATCHING_BONUS',
                        amount: p.amount,
                        detail: `Pair payout (${p.leftBv || 0}-${p.rightBv || 0})`,
                        createdAt: p.createdAt,
                    }));
                    if (!mounted) return
                    setTransactions([...payoutTxs, ...txs]);
                    const recs: PayoutRecord[] = payoutsRes.records || []
                    setPayouts(recs);
                    lastPayoutIdsRef.current = new Set(recs.map(r => r.id))
                } catch (err) {
                    console.log(err)
                    if (!mounted) return
                    setTransactions(txs);
                }

                if (!mounted) return
                setLoading(false);
            } catch (error) {
                console.error(error);
                router.push('/login');
            }
        }

        run()

        const iv = setInterval(async () => {
            try {
                const res = await getMyPayouts()
                const records: PayoutRecord[] = res.records || [];
                const existingIds = lastPayoutIdsRef.current || new Set<string>();
                const newOnes = records.filter((r: PayoutRecord) => !existingIds.has(r.id));
                if (newOnes.length) {
                    const created = newOnes.map((r: PayoutRecord) => ({ id: r.id, ts: Date.now(), message: `You received ₹${r.amount} for ${r.pairs || 0} pairs` }));
                    created.forEach(c => toast.success(c.message));
                    setNotifications(n => [...created, ...n].slice(0, 5));
                }
                setPayouts(records);
                // update seen ids
                lastPayoutIdsRef.current = new Set(records.map(r => r.id))
            } catch (err) {
                console.log(err)
            }
        }, 15000)

        return () => { mounted = false; clearInterval(iv) }
    }, [router])

    //
    function logout() {
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        router.push('/login');
    }

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <p className="text-gray-600">Loading...</p>
            </div>
        );
    }

    const totalBV = (user?.leftBV || 0) + (user?.leftCarryBV || 0) + (user?.rightBV || 0) + (user?.rightCarryBV || 0);

    return (
        <main className="min-h-screen bg-gray-50">
            <nav className="bg-white shadow-sm border-b">
                <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
                    <h1 className="text-2xl font-bold text-gray-800">MLM Dashboard</h1>
                    <div className="flex items-center gap-4">
                        <span className="text-sm text-gray-600">Hello, {user?.username}</span>
                        {user?.role === 'ADMIN' && (
                            <a href="/admin/products" className="text-sm px-3 py-1 bg-purple-600 text-white rounded">Admin Panel</a>
                        )}
                        <button onClick={logout} className="text-sm px-3 py-1 bg-gray-200 rounded hover:bg-gray-300">Logout</button>
                    </div>
                </div>
            </nav>

            <div className="max-w-7xl mx-auto px-4 py-8">
                {/* Stats Cards */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                    <div className="bg-white rounded-lg shadow p-6">
                        <h3 className="text-sm font-medium text-gray-500 mb-2">Wallet Balance</h3>
                        <p className="text-3xl font-bold text-green-600">₹{wallet?.balance || 0}</p>
                    </div>

                    <div className="bg-white rounded-lg shadow p-6">
                        <h3 className="text-sm font-medium text-gray-500 mb-2">Total BV</h3>
                        <p className="text-3xl font-bold text-blue-600">{totalBV}</p>
                    </div>

                    <div className="bg-white rounded-lg shadow p-6">
                        <h3 className="text-sm font-medium text-gray-500 mb-2">Left BV</h3>
                        <p className="text-2xl font-bold text-indigo-600">{(user?.leftBV || 0) + (user?.leftCarryBV || 0)}</p>
                        <p className="text-xs text-gray-500 mt-1">Carry: {user?.leftCarryBV || 0}</p>
                    </div>

                    <div className="bg-white rounded-lg shadow p-6">
                        <h3 className="text-sm font-medium text-gray-500 mb-2">Right BV</h3>
                        <p className="text-2xl font-bold text-pink-600">{(user?.rightBV || 0) + (user?.rightCarryBV || 0)}</p>
                        <p className="text-xs text-gray-500 mt-1">Carry: {user?.rightCarryBV || 0}</p>
                    </div>
                </div>

                {/* Action Buttons */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                    <a href="/products" className="bg-white rounded-lg shadow p-6 text-center hover:shadow-lg transition">
                        <h3 className="text-lg font-semibold text-gray-800">Browse Products</h3>
                        <p className="text-sm text-gray-500 mt-2">Purchase mattresses and earn BV</p>
                    </a>

                    <a href="/tree" className="bg-white rounded-lg shadow p-6 text-center hover:shadow-lg transition">
                        <h3 className="text-lg font-semibold text-gray-800">View Binary Tree</h3>
                        <p className="text-sm text-gray-500 mt-2">See your downline structure</p>
                    </a>

                    <a href="/withdraw" className="bg-white rounded-lg shadow p-6 text-center hover:shadow-lg transition">
                        <h3 className="text-lg font-semibold text-gray-800">Request Withdrawal</h3>
                        <p className="text-sm text-gray-500 mt-2">Withdraw your earnings</p>
                    </a>
                </div>

                {/* Recent Transactions */}
                <div className="bg-white rounded-lg shadow p-6">
                    <h2 className="text-xl font-bold text-gray-800 mb-4">Recent Transactions</h2>
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead>
                                <tr className="border-b">
                                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">Type</th>
                                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">Amount</th>
                                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">Detail</th>
                                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">Date</th>
                                </tr>
                            </thead>
                            <tbody>
                                {transactions.length === 0 ? (
                                    <tr>
                                        <td colSpan={4} className="text-center py-6 text-gray-500">No transactions yet</td>
                                    </tr>
                                ) : (
                                    transactions.map((tx) => (
                                        <tr key={tx.id} className="border-b hover:bg-gray-50">
                                            <td className="py-3 px-4">
                                                <span className={`px-2 py-1 text-xs rounded ${tx.type === 'PURCHASE' ? 'bg-red-100 text-red-800' :
                                                    tx.type === 'DIRECT_BONUS' ? 'bg-green-100 text-green-800' :
                                                        tx.type === 'MATCHING_BONUS' ? 'bg-blue-100 text-blue-800' :
                                                            'bg-gray-100 text-gray-800'
                                                    }`}>
                                                    {tx.type.replace('_', ' ')}
                                                </span>
                                            </td>
                                            <td className="py-3 px-4 font-semibold">
                                                <span className={tx.amount < 0 ? 'text-red-600' : 'text-green-600'}>
                                                    ₹{tx.amount}
                                                </span>
                                            </td>
                                            <td className="py-3 px-4 text-sm text-gray-600">{tx.detail}</td>
                                            <td className="py-3 px-4 text-sm text-gray-500">{new Date(tx.createdAt).toLocaleString()}</td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Matching Payouts */}
                <div className="bg-white rounded-lg shadow p-6 mt-6">
                    <h2 className="text-xl font-bold text-gray-800 mb-4">Matching Payouts</h2>
                    {payouts.length === 0 ? (
                        <p className="text-gray-500">No payouts yet</p>
                    ) : (
                        <ul className="space-y-3">
                            {payouts.map(p => (
                                <li key={p.id} className="flex items-center justify-between p-3 border rounded">
                                    <div>
                                        <div className="font-semibold">₹{p.amount}</div>
                                        <div className="text-sm text-gray-500">{p.pairs} pairs — {new Date(p.createdAt).toLocaleString()}</div>
                                    </div>
                                    <div className="text-sm text-gray-400">{p.date ? new Date(p.date).toLocaleDateString() : ''}</div>
                                </li>
                            ))}
                        </ul>
                    )}
                </div>

                {/* Notifications */}
                <div className="fixed bottom-6 right-6 w-80 space-y-2 z-50">
                    {notifications.map(n => (
                        <div key={`${n.id}_${n.ts}`} className="bg-white p-3 rounded shadow flex items-start gap-3">
                            <div className="flex-1">
                                <div className="font-medium">{n.message}</div>
                            </div>
                            <button onClick={() => setNotifications(ns => ns.filter(x => x.id !== n.id))} className="text-sm text-gray-400">Dismiss</button>
                        </div>
                    ))}
                </div>

                {/* User ID for referrals */}
                <div className="mt-8 bg-linear-to-r from-blue-500 to-purple-600 rounded-lg shadow p-6 text-white">
                    <h3 className="text-lg font-semibold mb-2">Your Referral ID</h3>
                    <p className="text-sm mb-3">Share this ID with new members to earn direct referral bonuses</p>
                    <div className="bg-white/20 rounded p-3 font-mono text-lg">
                        {user?.id}
                    </div>
                </div>
            </div>
        </main>
    )
}
