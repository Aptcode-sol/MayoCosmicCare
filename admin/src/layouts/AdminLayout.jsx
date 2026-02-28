import { useEffect, useMemo, useRef, useState } from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { adminLogout } from '../lib/auth';
import api from '../lib/api';
import toast from 'react-hot-toast';

const tabs = [
    { key: 'analytics', label: 'Analytics', path: '/dashboard/analytics' },
    { key: 'products', label: 'Products', path: '/dashboard/products' },
    { key: 'users', label: 'Users', path: '/dashboard/users' },
    { key: 'network', label: 'Network', path: '/dashboard/network' },
    { key: 'positions', label: 'Positions', path: '/dashboard/positions' },
    { key: 'withdrawals', label: 'Withdrawals', path: '/dashboard/withdrawals' }
];

export default function AdminLayout() {
    const navigate = useNavigate();
    const location = useLocation();
    const [mobileTabsOpen, setMobileTabsOpen] = useState(false);
    const [showNavbar, setShowNavbar] = useState(true);
    const lastScrollY = useRef(0);

    // Password change state
    const [showPwModal, setShowPwModal] = useState(false);
    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [pwLoading, setPwLoading] = useState(false);

    const activeTab = useMemo(() => {
        const found = tabs.find(t => location.pathname.startsWith(t.path));
        return found || tabs[0];
    }, [location.pathname]);

    useEffect(() => {
        const handleScroll = () => {
            // Scroll hiding disabled - header always visible
        };

        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    const openPwModal = () => {
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
        setShowPwModal(true);
    };

    const handleChangePassword = async () => {
        if (!currentPassword || !newPassword || !confirmPassword) {
            toast.error('All fields are required');
            return;
        }
        if (newPassword.length < 6) {
            toast.error('New password must be at least 6 characters');
            return;
        }
        if (newPassword !== confirmPassword) {
            toast.error('New passwords do not match');
            return;
        }
        setPwLoading(true);
        try {
            const res = await api.post('/api/auth/change-password', { currentPassword, newPassword });
            if (res.data?.ok) {
                toast.success('Password changed successfully');
                setShowPwModal(false);
            } else {
                toast.error(res.data?.error || 'Failed to change password');
            }
        } catch (err) {
            toast.error(err?.response?.data?.error || err?.message || 'Failed to change password');
        } finally {
            setPwLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gray-50/30">
            {/* Password Change Modal */}
            {showPwModal && (
                <div className="fixed inset-0 bg-black/50 z-[200] flex items-center justify-center p-4" onClick={() => setShowPwModal(false)}>
                    <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-between mb-5">
                            <h3 className="text-lg font-semibold text-gray-900">Change Password</h3>
                            <button onClick={() => setShowPwModal(false)} className="p-1 hover:bg-gray-100 rounded-lg transition-colors">
                                <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Current Password</label>
                                <input
                                    type="password"
                                    value={currentPassword}
                                    onChange={(e) => setCurrentPassword(e.target.value)}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent"
                                    placeholder="Enter current password"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">New Password</label>
                                <input
                                    type="password"
                                    value={newPassword}
                                    onChange={(e) => setNewPassword(e.target.value)}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent"
                                    placeholder="Enter new password"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Confirm New Password</label>
                                <input
                                    type="password"
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent"
                                    placeholder="Re-enter new password"
                                    onKeyDown={(e) => e.key === 'Enter' && handleChangePassword()}
                                />
                            </div>
                        </div>
                        <div className="flex gap-3 mt-6">
                            <button
                                onClick={() => setShowPwModal(false)}
                                className="flex-1 px-4 py-2.5 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleChangePassword}
                                disabled={pwLoading}
                                className="flex-1 px-4 py-2.5 text-sm font-medium text-white bg-gray-900 hover:bg-gray-800 rounded-lg transition-colors disabled:opacity-50"
                            >
                                {pwLoading ? 'Changing...' : 'Change Password'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Header */}
            <header className={`bg-white border-b border-gray-100 sticky top-0 z-50 transition-transform duration-300 ${showNavbar ? 'translate-y-0' : '-translate-y-full'}`}>
                <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
                    <div>
                        <h1 className="text-xl font-semibold text-gray-900">Admin Console</h1>
                        <p className="text-gray-500 text-sm">Manage products and users</p>
                    </div>
                    <div className="flex items-center gap-3">
                        <button
                            onClick={openPwModal}
                            className="px-4 py-2 border border-gray-200 hover:bg-amber-50 hover:border-amber-200 hover:text-amber-700 text-gray-700 rounded-xl transition-colors text-sm font-medium"
                        >
                            Reset Password
                        </button>
                        <button
                            onClick={adminLogout}
                            className="px-4 py-2 border border-gray-200 hover:bg-gray-50 text-gray-700 rounded-xl transition-colors text-sm font-medium"
                        >
                            Logout
                        </button>
                    </div>
                </div>

                {/* Tabs */}
                <div className="max-w-7xl mx-auto px-6 border-t border-gray-100">
                    {/* Desktop Tabs */}
                    <div className="hidden sm:flex gap-1">
                        {tabs.map((t) => (
                            <button
                                key={t.key}
                                onClick={() => { navigate(t.path); setMobileTabsOpen(false); }}
                                className={`px-6 py-3 text-sm font-medium transition-all relative ${activeTab.key === t.key ? 'text-gray-900' : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                                    }`}
                            >
                                {t.label}
                                {activeTab.key === t.key && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gray-900" />}
                            </button>
                        ))}
                    </div>

                    {/* Mobile Tabs - Hamburger Menu with slide-in from right */}
                    <div className="sm:hidden relative">
                        <button
                            onClick={() => setMobileTabsOpen(!mobileTabsOpen)}
                            className="w-full py-3 px-4 flex items-center justify-between text-sm font-medium text-gray-900 hover:bg-gray-50"
                        >
                            <span>{activeTab.label}</span>
                            {/* Hamburger Menu Icon */}
                            <div className="w-6 h-6 flex flex-col justify-center items-center gap-1.5 cursor-pointer">
                                <span className={`block w-6 h-0.5 bg-gray-900 transition-all duration-300 origin-center ${mobileTabsOpen ? 'rotate-45 translate-y-2' : ''}`}></span>
                                <span className={`block w-6 h-0.5 bg-gray-900 transition-all duration-300 ${mobileTabsOpen ? 'opacity-0' : 'opacity-100'}`}></span>
                                <span className={`block w-6 h-0.5 bg-gray-900 transition-all duration-300 origin-center ${mobileTabsOpen ? '-rotate-45 -translate-y-2' : ''}`}></span>
                            </div>
                        </button>

                        {/* Slide-in Menu from Right */}
                        <div className={`absolute top-full right-0 left-0 bg-white border-t border-gray-100 shadow-lg transition-all duration-300 origin-top ${mobileTabsOpen ? 'opacity-100 visible max-h-96 overflow-y-auto' : 'opacity-0 invisible max-h-0'}`}>
                            <div className="flex flex-col">
                                {tabs.map((t) => (
                                    <button
                                        key={t.key}
                                        onClick={() => { navigate(t.path); setMobileTabsOpen(false); }}
                                        className={`px-6 py-3 text-sm font-medium text-left transition-colors border-b border-gray-50 ${activeTab.key === t.key ? 'bg-gray-900 text-white' : 'text-gray-600 hover:bg-gray-50'
                                            }`}
                                    >
                                        {t.label}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </header>

            <main className="max-w-7xl mx-auto px-6 py-8">
                <Outlet />
            </main>
        </div>
    );
}
