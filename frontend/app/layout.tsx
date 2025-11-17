import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import ClientToaster from '../components/ClientToaster'
import Header from '../components/Header'

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' })

export const metadata: Metadata = {
  title: 'MLM Network - Partner System',
  description: 'Join our partner network and build your business',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={`${inter.variable} font-sans antialiased bg-[#fdfcfb] text-gray-800 min-h-screen`}>
        <ClientToaster />
        <Header />
        {children}
      </body>
    </html>
  )
}
