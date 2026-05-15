'use client'
import Image from 'next/image'
import Link from 'next/link'

interface Feature {
    icon: string
    text: string
}

interface AuthLeftPanelProps {
    /** Unique key — changing this re-triggers the fade animation on dynamic content */
    variant: 'login' | 'register'
    headline: string
    description: string
    features: Feature[]
}

export default function AuthLeftPanel({ variant, headline, description, features }: AuthLeftPanelProps) {
    return (
        <section className="hidden md:flex md:w-1/2 bg-surface-container-low border-r border-outline-variant flex-col p-container-margin items-center">
            {/* Back link — static, no animation */}
            <div className="mb-stack-md self-start">
                <Link href="/" className="flex items-center gap-2 text-on-surface-variant hover:text-primary transition-colors">
                    <span className="material-symbols-outlined text-[20px]">arrow_back</span>
                    <span className="font-label-sm text-label-sm">Back to Home</span>
                </Link>
            </div>

            {/* Centerpiece — static structural shell */}
            <div className="flex-grow flex flex-col justify-center items-center text-center max-w-lg mx-auto w-full">

                {/* Brand name — static */}
                <div className="flex items-center gap-base justify-center mb-stack-md">
                    <h1 className="font-headline-lg text-headline-lg font-bold text-primary tracking-tight">Mayo Cosmic Care</h1>
                </div>

                {/* Logo image — static */}
                <div className="relative w-40 h-40 mx-auto mb-base">
                    <div className="absolute inset-0 flex items-center justify-center p-2">
                        <Image
                            src="/MCC2.png"
                            alt="Mayo Cosmic Care"
                            fill
                            sizes="160px"
                            className="object-contain drop-shadow-2xl grayscale contrast-125 brightness-110"
                        />
                    </div>
                </div>

                {/* ↓ ANIMATED: only this block re-fades when switching between pages */}
                <div key={variant} className="animate-fade-in w-full">
                    <h2 className="font-display-xl text-display-xl mb-stack-md leading-tight text-on-surface">
                        {headline}
                    </h2>
                    <p className="text-on-surface-variant font-body-md max-w-md mx-auto mb-stack-md">
                        {description}
                    </p>
                    <div className="grid grid-cols-1 gap-stack-sm mb-8 max-w-sm mx-auto">
                        {features.map((f) => (
                            <div
                                key={f.icon}
                                className="bg-surface-container-low px-4 py-2.5 border border-outline-variant rounded flex items-center justify-center gap-3"
                            >
                                <span className="material-symbols-outlined text-on-surface-variant text-[20px]">{f.icon}</span>
                                <span className="font-label-sm text-label-sm text-on-surface">{f.text}</span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Footer — static */}
            <footer className="pt-stack-md mt-auto">
                <p className="font-label-sm text-label-sm text-on-secondary-fixed-variant text-center">
                    Essential Wellness. Designed for Longevity.
                </p>
            </footer>
        </section>
    )
}
