"use client"
import Link from 'next/link'
import { useEffect, useState } from 'react'
import { useAuth } from '../context/AuthContext'

export default function NotFound() {
    const [mounted, setMounted] = useState(false)
    const { isLoggedIn, isLoading } = useAuth()

    useEffect(() => {
        setMounted(true)
    }, [])

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50 flex flex-col items-center justify-center relative overflow-hidden px-5 py-10">
            {/* Animated background blobs */}
            <div className="absolute inset-0 pointer-events-none overflow-hidden">
                <div className="absolute top-[10%] left-[10%] w-[500px] h-[500px] bg-blue-100/40 rounded-full blur-[120px] animate-pulse" />
                <div className="absolute bottom-[10%] right-[10%] w-[400px] h-[400px] bg-purple-100/30 rounded-full blur-[100px] animate-pulse" style={{ animationDelay: '1s' }} />
                <div className="absolute top-[50%] left-[60%] w-[300px] h-[300px] bg-indigo-50/50 rounded-full blur-[80px] animate-pulse" style={{ animationDelay: '2s' }} />
            </div>

            <div className={`relative z-10 flex flex-col items-center text-center max-w-2xl transition-all duration-1000 ease-out ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-12'}`}>

                {/* 1. Error 404 badge — FIRST */}
                <div className={`mt-10 mb-5 transition-all duration-700 delay-100 ${mounted ? 'opacity-100 scale-100' : 'opacity-0 scale-75'}`}>
                    <span className="inline-flex items-center gap-2 px-5 py-2 rounded-full bg-indigo-50 text-indigo-600 text-sm font-semibold tracking-wide border border-indigo-100">
                        <span className="w-2 h-2 rounded-full bg-indigo-400 animate-pulse" />
                        Error 404
                    </span>
                </div>

                {/* 2. SVG Illustration — Astronaut */}
                <div className="w-64 h-64 mb-0">
                    <svg viewBox="0 0 500 500" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full drop-shadow-xl">
                        {/* Starfield */}
                        <circle cx="60" cy="80" r="2" fill="#cbd5e1" className="animate-pulse" />
                        <circle cx="430" cy="60" r="1.5" fill="#a5b4fc" className="animate-pulse" style={{ animationDelay: '0.5s' }} />
                        <circle cx="380" cy="140" r="2" fill="#cbd5e1" className="animate-pulse" style={{ animationDelay: '1s' }} />
                        <circle cx="100" cy="380" r="1.5" fill="#c4b5fd" className="animate-pulse" style={{ animationDelay: '1.5s' }} />
                        <circle cx="440" cy="350" r="2" fill="#cbd5e1" className="animate-pulse" style={{ animationDelay: '0.3s' }} />
                        <circle cx="160" cy="150" r="1" fill="#a5b4fc" className="animate-pulse" style={{ animationDelay: '0.8s' }} />
                        <circle cx="340" cy="420" r="1.5" fill="#cbd5e1" className="animate-pulse" style={{ animationDelay: '1.2s' }} />
                        <circle cx="50" cy="300" r="1.5" fill="#c4b5fd" className="animate-pulse" style={{ animationDelay: '2s' }} />

                        {/* Planet */}
                        <circle cx="400" cy="120" r="35" fill="url(#planetGrad)" opacity="0.7" />
                        <ellipse cx="400" cy="120" rx="50" ry="8" stroke="#a5b4fc" strokeWidth="1.5" opacity="0.4" transform="rotate(-15 400 120)" />

                        {/* Small moon */}
                        <circle cx="90" cy="200" r="18" fill="#e2e8f0" />
                        <circle cx="82" cy="195" r="4" fill="#cbd5e1" />
                        <circle cx="98" cy="205" r="3" fill="#cbd5e1" />

                        {/* Astronaut body */}
                        <g className="animate-bounce" style={{ animationDuration: '4s' }}>
                            {/* Backpack */}
                            <rect x="210" y="235" width="35" height="65" rx="8" fill="#94a3b8" />
                            <rect x="215" y="245" width="10" height="10" rx="2" fill="#64748b" />
                            <rect x="215" y="262" width="10" height="10" rx="2" fill="#64748b" />

                            {/* Body / Suit */}
                            <rect x="235" y="225" width="70" height="85" rx="20" fill="white" stroke="#e2e8f0" strokeWidth="2" />

                            {/* Chest panel */}
                            <rect x="252" y="248" width="36" height="25" rx="5" fill="#f1f5f9" stroke="#e2e8f0" strokeWidth="1" />
                            <circle cx="262" cy="256" r="3" fill="#22c55e" className="animate-pulse" />
                            <rect x="270" y="254" width="12" height="2" rx="1" fill="#cbd5e1" />
                            <rect x="270" y="259" width="8" height="2" rx="1" fill="#cbd5e1" />
                            <rect x="270" y="264" width="10" height="2" rx="1" fill="#cbd5e1" />

                            {/* Helmet */}
                            <circle cx="270" cy="210" r="40" fill="white" stroke="#e2e8f0" strokeWidth="2.5" />
                            {/* Visor */}
                            <circle cx="270" cy="210" r="28" fill="url(#visorGrad)" />
                            {/* Visor reflection */}
                            <ellipse cx="259" cy="200" rx="8" ry="12" fill="white" opacity="0.25" transform="rotate(-15 259 200)" />

                            {/* Left arm — waving */}
                            <g transform="rotate(-30 235 250)">
                                <rect x="195" y="240" width="45" height="22" rx="11" fill="white" stroke="#e2e8f0" strokeWidth="2" />
                                <circle cx="198" cy="251" r="12" fill="#f1f5f9" stroke="#e2e8f0" strokeWidth="1.5" />
                            </g>

                            {/* Right arm */}
                            <g transform="rotate(15 305 250)">
                                <rect x="300" y="240" width="45" height="22" rx="11" fill="white" stroke="#e2e8f0" strokeWidth="2" />
                                <circle cx="342" cy="251" r="12" fill="#f1f5f9" stroke="#e2e8f0" strokeWidth="1.5" />
                            </g>

                            {/* Left leg */}
                            <rect x="248" y="300" width="22" height="40" rx="11" fill="white" stroke="#e2e8f0" strokeWidth="2" />
                            <rect x="245" y="332" width="28" height="16" rx="8" fill="#f1f5f9" stroke="#e2e8f0" strokeWidth="1.5" />

                            {/* Right leg */}
                            <rect x="276" y="300" width="22" height="40" rx="11" fill="white" stroke="#e2e8f0" strokeWidth="2" transform="rotate(10 287 320)" />
                            <rect x="278" y="335" width="28" height="16" rx="8" fill="#f1f5f9" stroke="#e2e8f0" strokeWidth="1.5" transform="rotate(10 292 343)" />

                            {/* Disconnected cable */}
                            <path d="M210 260 Q 170 280 150 310 Q 135 340 155 360" stroke="#64748b" strokeWidth="3" fill="none" strokeLinecap="round" strokeDasharray="6 4" />
                            <circle cx="155" cy="360" r="5" fill="#ef4444" className="animate-pulse" />
                        </g>

                        {/* Floating "?" bubbles */}
                        <g className="animate-bounce" style={{ animationDuration: '3s', animationDelay: '0.5s' }}>
                            <circle cx="330" cy="170" r="15" fill="#f1f5f9" stroke="#e2e8f0" strokeWidth="1.5" />
                            <text x="325" y="177" fontSize="16" fontWeight="600" fill="#6366f1">?</text>
                        </g>
                        <g className="animate-bounce" style={{ animationDuration: '3.5s', animationDelay: '1s' }}>
                            <circle cx="355" cy="195" r="10" fill="#f1f5f9" stroke="#e2e8f0" strokeWidth="1" />
                            <text x="351" y="200" fontSize="11" fontWeight="600" fill="#818cf8">?</text>
                        </g>

                        {/* Gradients */}
                        <defs>
                            <linearGradient id="visorGrad" x1="242" y1="185" x2="298" y2="235">
                                <stop offset="0%" stopColor="#6366f1" />
                                <stop offset="50%" stopColor="#818cf8" />
                                <stop offset="100%" stopColor="#a5b4fc" />
                            </linearGradient>
                            <linearGradient id="planetGrad" x1="365" y1="85" x2="435" y2="155">
                                <stop offset="0%" stopColor="#c4b5fd" />
                                <stop offset="100%" stopColor="#818cf8" />
                            </linearGradient>
                        </defs>
                    </svg>
                </div>

                {/* 3. Heading & Description */}
                <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 tracking-tight mb-2 leading-tight">
                    Lost in Space
                </h1>
                <p className="text-gray-500 text-sm sm:text-base leading-relaxed mb-8 max-w-sm mx-auto">
                    The page you&apos;re looking for has drifted into the cosmos. Let&apos;s navigate you back to safety.
                </p>

                {/* 4. Action buttons — conditional on auth */}
                <div className={`flex flex-col sm:flex-row items-center justify-center gap-3 transition-all duration-700 delay-500 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'}`}>
                    {!isLoading && (
                        isLoggedIn ? (
                            <Link
                                href="/dashboard"
                                className="group inline-flex items-center gap-3 h-12 px-7 rounded-2xl bg-gray-900 text-white text-sm font-semibold hover:bg-gray-800 transition-all duration-300 hover:shadow-2xl hover:shadow-gray-900/20 hover:-translate-y-0.5"
                            >
                                <svg className="w-4 h-4 transition-transform duration-300 group-hover:scale-110" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                                </svg>
                                Go to Dashboard
                            </Link>
                        ) : (
                            <Link
                                href="/login"
                                className="group inline-flex items-center gap-3 h-12 px-7 rounded-2xl bg-gray-900 text-white text-sm font-semibold hover:bg-gray-800 transition-all duration-300 hover:shadow-2xl hover:shadow-gray-900/20 hover:-translate-y-0.5"
                            >
                                <svg className="w-4 h-4 transition-transform duration-300 group-hover:scale-110" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15m3 0l3-3m0 0l-3-3m3 3H9" />
                                </svg>
                                Login
                            </Link>
                        )
                    )}
                    <Link
                        href="/"
                        className="group inline-flex items-center gap-3 h-12 px-7 rounded-2xl bg-white text-gray-700 text-sm font-semibold border-2 border-gray-200 hover:border-gray-300 hover:bg-gray-50 transition-all duration-300 hover:shadow-lg hover:-translate-y-0.5"
                    >
                        <svg className="w-4 h-4 transition-transform duration-300 group-hover:-translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                        </svg>
                        Back to Home
                    </Link>
                </div>

                {/* Footer branding */}
                <div className={`mt-12 flex items-center gap-4 justify-center transition-all duration-700 delay-700 ${mounted ? 'opacity-100' : 'opacity-0'}`}>
                    <div className="w-12 h-px bg-gradient-to-r from-transparent to-gray-200" />
                    <span className="text-xs text-gray-400 uppercase tracking-[0.25em] font-medium">Biofield Wellness</span>
                    <div className="w-12 h-px bg-gradient-to-l from-transparent to-gray-200" />
                </div>
            </div>
        </div>
    )
}
