import type { Metadata } from 'next'
import { Inter, Hanken_Grotesk } from 'next/font/google'
import './globals.css'
import ClientToaster from '../components/ClientToaster'
import HeaderClient from '../components/HeaderClient'
import FooterClient from '../components/FooterClient'
import SmoothScroll from '../components/SmoothScroll'

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' })
const hankenGrotesk = Hanken_Grotesk({ subsets: ['latin'], variable: '--font-hanken-grotesk' })

export const metadata: Metadata = {
  title: 'Mayo Cosmic Care - Partner Network',
  description: 'Join Mayo Cosmic Care and build your wellness business with our premium products',
  icons: {
    // Provide explicit icon entries with sizes/types and a fallback
    icon: [
      { url: '/MCC_Light.png', sizes: '32x32', type: 'image/png' },
    ],
    apple: '/MCC_Light.png',
    shortcut: '/MCC_Light.png'
  },
}

import ContextProviders from '../components/ContextProviders'

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link precedence="default" href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200&display=swap" rel="stylesheet" />
      </head>
      <body className={`${inter.variable} ${hankenGrotesk.variable} font-sans antialiased bg-white text-gray-900 min-h-screen flex flex-col`} suppressHydrationWarning>
        <ContextProviders>
          <ClientToaster />
          <HeaderClient />
          <SmoothScroll>
            <div className="flex-1">
              {children}
            </div>
          </SmoothScroll>
          <FooterClient />
        </ContextProviders>
      </body>
    </html>
  )
}
