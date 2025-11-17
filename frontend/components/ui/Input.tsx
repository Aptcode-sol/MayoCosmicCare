import React from 'react'

export default function Input(props: React.InputHTMLAttributes<HTMLInputElement>) {
    return (
        <input {...props} className={`w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-400 focus:border-transparent bg-gray-50 ${props.className || ''}`} />
    )
}
