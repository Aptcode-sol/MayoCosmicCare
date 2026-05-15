import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { adminLogin, isAuthenticated } from '../lib/auth';
import toast from 'react-hot-toast';

export default function Login() {
    const navigate = useNavigate();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);

    // If already authenticated, redirect to dashboard
    useEffect(() => {
        if (isAuthenticated()) {
            navigate('/dashboard/analytics');
        }
    }, [navigate]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);

        try {
            const result = await adminLogin(email, password);
            if (result.ok) {
                toast.success('Welcome back!');
                window.location.href = '/dashboard/analytics';
            } else {
                toast.error(result.error || 'Login failed');
            }
        } catch (err) {
            toast.error(err.response?.data?.error || 'Login failed');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex flex-col md:flex-row overflow-x-hidden animate-slide-in-left">
            {/* Left Panel: Branding */}
            <section className="hidden md:flex md:w-1/2 bg-surface-container-low border-r border-outline-variant flex-col p-container-margin items-center">
                {/* Back nav placeholder to keep spacing consistent */}
                <div className="mb-stack-md self-start">
                    <div className="flex items-center gap-2 text-on-surface-variant">
                        <span className="material-symbols-outlined text-[18px]">admin_panel_settings</span>
                        <span className="text-label-sm font-medium tracking-wide uppercase text-on-surface-variant">System Administration</span>
                    </div>
                </div>

                {/* Centerpiece */}
                <div className="flex-grow flex flex-col justify-center items-center text-center max-w-lg mx-auto w-full">
                    <div className="flex items-center gap-base justify-center mb-stack-md">
                        <h1 className="text-headline-lg font-bold text-primary tracking-tight">Mayo Cosmic Care</h1>
                    </div>

                    {/* MCC Logo */}
                    <div className="relative w-40 h-40 mx-auto mb-stack-md">
                        <div className="absolute inset-0 flex items-center justify-center p-2">
                            <img
                                src="/MCC2.png"
                                alt="Mayo Cosmic Care"
                                className="w-full h-full object-contain drop-shadow-2xl grayscale contrast-125 brightness-110"
                            />
                        </div>
                    </div>

                    <h2 className="text-display-xl mb-stack-md leading-tight text-on-surface">Admin Dashboard</h2>
                    <p className="text-body-md text-on-surface-variant max-w-md mx-auto mb-stack-md">
                        Secure access to the Mayo Cosmic Care administration portal. Authorized personnel only.
                    </p>

                    {/* Info Boxes */}
                    <div className="w-full max-w-sm mx-auto space-y-stack-sm">
                        <div className="bg-surface-container-low px-4 py-2.5 border border-outline-variant rounded flex items-center justify-center gap-3">
                            <span className="material-symbols-outlined text-on-surface-variant text-[20px]">manage_accounts</span>
                            <span className="text-label-sm">Manage members, distributors &amp; network</span>
                        </div>
                        <div className="bg-surface-container-low px-4 py-2.5 border border-outline-variant rounded flex items-center justify-center gap-3">
                            <span className="material-symbols-outlined text-on-surface-variant text-[20px]">analytics</span>
                            <span className="text-label-sm">View real-time business analytics &amp; reports</span>
                        </div>
                        <div className="bg-surface-container-low px-4 py-2.5 border border-outline-variant rounded flex items-center justify-center gap-3">
                            <span className="material-symbols-outlined text-on-surface-variant text-[20px]">account_balance_wallet</span>
                            <span className="text-label-sm">Process commissions, wallets &amp; payouts</span>
                        </div>
                    </div>
                </div>

                <footer className="pt-stack-md mt-auto">
                    <p className="text-label-sm text-on-secondary-fixed-variant text-center">
                        Mayo Cosmic Care &mdash; Admin Console
                    </p>
                </footer>
            </section>

            {/* Right Panel: Login Form */}
            <main className="w-full md:w-1/2 bg-surface-container-lowest flex items-center justify-center px-8 pt-8 pb-6 sm:p-gutter md:p-container-margin">
                <div className="w-full max-w-[400px]">
                    <div className="md:hidden flex items-center gap-2 mb-6 self-start">
                        <img src="/MCC2.png" alt="Mayo Cosmic Care" className="w-8 h-8 object-contain" />
                        <span className="text-[18px] font-semibold text-on-surface tracking-tight leading-tight">Mayo Cosmic Care</span>
                    </div>

                    {/* Form header */}
                    <div className="mb-6">
                        <h2 className="text-3xl sm:text-display-xl text-on-surface mb-2 tracking-tight leading-tight">Welcome back</h2>
                        <p className="text-body-md text-on-surface-variant">Enter your admin credentials to access the dashboard.</p>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-4">
                        {/* Email */}
                        <div className="space-y-1">
                            <label className="text-label-sm text-on-surface-variant" htmlFor="admin-email">
                                Admin Username Or Email
                            </label>
                            <input
                                id="admin-email"
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="w-full px-3 py-3 text-base bg-surface-container-lowest border border-outline-variant rounded text-on-surface placeholder:text-on-surface-variant/40 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all duration-200"
                                placeholder="admin@mayocosmiccare.com"
                                required
                            />
                        </div>

                        {/* Password */}
                        <div className="space-y-1">
                            <div className="flex justify-between items-center">
                                <label className="text-label-sm text-on-surface-variant" htmlFor="admin-password">
                                    Password
                                </label>
                                <button
                                    type="button"
                                    className="text-label-sm text-secondary hover:text-primary transition-colors"
                                    onClick={() => toast('Contact your system administrator to reset your password.')}
                                >
                                    Forgot Password?
                                </button>
                            </div>
                            <div className="relative">
                                <input
                                    id="admin-password"
                                    type={showPassword ? 'text' : 'password'}
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="w-full px-3 py-3 pr-10 text-base bg-surface-container-lowest border border-outline-variant rounded text-on-surface placeholder:text-on-surface-variant/40 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all duration-200"
                                    placeholder="••••••••"
                                    required
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-on-surface-variant hover:text-primary transition-colors"
                                >
                                    <span className="material-symbols-outlined text-[20px]">
                                        {showPassword ? 'visibility_off' : 'visibility'}
                                    </span>
                                </button>
                            </div>
                        </div>

                        {/* Submit */}
                        <div className="pt-2">
                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full min-h-12 bg-primary text-on-primary py-3 px-base rounded text-button-text font-semibold hover:bg-primary-container transition-colors duration-300 disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                            >
                                {loading ? (
                                    <>
                                        <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                        </svg>
                                        Signing in...
                                    </>
                                ) : 'Sign In to Dashboard'}
                            </button>
                        </div>
                    </form>

                    {/* Footer note */}
                    <div className="mt-6 pt-4 border-t border-outline-variant text-center">
                        <p className="text-label-sm text-on-surface-variant">
                            This portal is for authorized administrators only.
                        </p>
                    </div>
                </div>
            </main>
        </div>
    );
}
