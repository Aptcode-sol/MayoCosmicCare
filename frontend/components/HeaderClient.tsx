"use client"
import dynamic from 'next/dynamic'
import React from 'react'

const Header = dynamic(() => import('./Header'), { ssr: false })

export default function HeaderClient() {
    return <Header />
}
