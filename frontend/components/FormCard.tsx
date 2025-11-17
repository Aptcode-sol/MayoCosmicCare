import React from 'react'

export default function FormCard({ title, children, subtitle }: { title: string, children: React.ReactNode, subtitle?: string }) {
    return (
        <div className="bg-white rounded-2xl shadow-lg p-8 w-full max-w-md">
            <div className="mb-6">
                <h1 className="text-2xl font-semibold text-gray-800">{title}</h1>
                {subtitle && <p className="mt-1 text-sm text-gray-500">{subtitle}</p>}
            </div>
            <div className="space-y-4">
                {children}
            </div>
        </div>
    )
}
