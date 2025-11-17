import React from 'react'

export default function Field({ label, htmlFor, error, children }: { label?: string, htmlFor?: string, error?: string, children: React.ReactNode }) {
    return (
        <div>
            {label && <label htmlFor={htmlFor} className="block text-sm font-medium text-gray-700 mb-1">{label}</label>}
            {children}
            {error && <div className="mt-1 text-xs text-red-600">{error}</div>}
        </div>
    )
}
