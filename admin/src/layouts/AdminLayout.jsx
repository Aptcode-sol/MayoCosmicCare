import { useEffect, useMemo, useRef, useState } from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { adminLogout } from '../lib/auth';

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

    const activeTab = useMemo(() => {
        const found = tabs.find(t => location.pathname.startsWith(t.path));
        return found || tabs[0];
    }, [location.pathname]);

    useEffect(() => {
        const handleScroll = () => {
            const currentScrollY = window.scrollY;
            if (currentScrollY > lastScrollY.current && currentScrollY > 50) {
                setShowNavbar(false);
            } else {
                setShowNavbar(true);
            }
            lastScrollY.current = currentScrollY;
        };

        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    return (
        <div className="min-h-screen bg-gray-50/30">
            {/* Header */}
            <header className={`bg-white border-b border-gray-100 sticky top-0 z-50 transition-transform duration-300 ${showNavbar ? 'translate-y-0' : '-translate-y-full'}`}>
                <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
                    <div>
                        <h1 className="text-xl font-semibold text-gray-900">Admin Console</h1>
                        <p className="text-gray-500 text-sm">Manage products and users</p>
                    </div>
                    <button
                        onClick={adminLogout}
                        className="px-4 py-2 border border-gray-200 hover:bg-gray-50 text-gray-700 rounded-xl transition-colors text-sm font-medium"
                    >
                        Logout
                    </button>
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
