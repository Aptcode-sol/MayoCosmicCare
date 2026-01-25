import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import ClientToaster from '../components/ClientToaster'
import Header from '../components/Header'
import Footer from '../components/Footer'

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' })

export const metadata: Metadata = {
  title: 'Mayo Cosmic Care - Partner Network',
  description: 'Join Mayo Cosmic Care and build your wellness business with our premium products',
}

import ContextProviders from '../components/ContextProviders'

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={`${inter.variable} font-sans antialiased bg-white text-gray-900 min-h-screen flex flex-col`}>
        <ContextProviders>
          <ClientToaster />
          <Header />
          <div className="flex-1">
            {children}
          </div>
          <Footer />
        </ContextProviders>
      </body>
    </html>
  )
}
