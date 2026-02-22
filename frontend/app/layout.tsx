import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import ClientToaster from '../components/ClientToaster'
import HeaderClient from '../components/HeaderClient'
import Footer from '../components/Footer'
import SmoothScroll from '../components/SmoothScroll'

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' })

export const metadata: Metadata = {
  title: 'Mayo Cosmic Care - Partner Network',
  description: 'Join Mayo Cosmic Care and build your wellness business with our premium products',
  icons: {
    // Provide explicit icon entries with sizes/types and a fallback
    icon: [
      { url: '/MCC_Light.png', sizes: '32x32', type: 'image/png' },
      { url: '/MCC2.png', sizes: '32x32', type: 'image/png' }
    ],
    apple: '/MCC_Light.png',
    shortcut: '/MCC_Light.png'
  },
}

import ContextProviders from '../components/ContextProviders'

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.variable} font-sans antialiased bg-white text-gray-900 min-h-screen flex flex-col`} suppressHydrationWarning>
        <ContextProviders>
          <ClientToaster />
          <HeaderClient />
          <SmoothScroll>
            <div className="flex-1">
              {children}
            </div>
          </SmoothScroll>
          <Footer />
        </ContextProviders>
      </body>
    </html>
  )
}
