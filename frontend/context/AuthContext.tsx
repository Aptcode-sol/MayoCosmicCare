"use client"
import React, { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { me as fetchMe } from '../lib/services/auth'

interface User {
    id?: string
    username?: string
    name?: string
    email?: string
}

interface AuthContextType {
    user: User | null
    isLoggedIn: boolean
    isLoading: boolean
    login: (accessToken: string, refreshToken: string) => void
    logout: () => void
    refreshUser: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | null>(null)

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [user, setUser] = useState<User | null>(null)
    const [isLoggedIn, setIsLoggedIn] = useState(false)
    const [isLoading, setIsLoading] = useState(true)
    const router = useRouter()

    // Clear auth and redirect to login
    const logout = useCallback(() => {
        localStorage.removeItem('accessToken')
        localStorage.removeItem('refreshToken')
        setUser(null)
        setIsLoggedIn(false)
        router.push('/login')
    }, [router])

    // Refresh user data from server
    const refreshUser = useCallback(async () => {
        const token = localStorage.getItem('accessToken')
        if (!token) {
            setUser(null)
            setIsLoggedIn(false)
            setIsLoading(false)
            return
        }

        try {
            const res = await fetchMe()
            const userData = res?.user || res

            if (userData && (userData.id || userData.username)) {
                setUser(userData)
                setIsLoggedIn(true)
            } else {
                // Invalid response - clear auth
                logout()
            }
        } catch (error: any) {
            console.error('Auth refresh failed:', error)
            // If we get an error, the API interceptor should have already handled redirect
            // But just in case, clear local state
            if (error?.status === 401 || error?.status === 403 || error?.message?.includes('401')) {
                logout()
            } else {
                // For network errors, don't logout - just mark as not loading
                setIsLoading(false)
            }
        } finally {
            setIsLoading(false)
        }
    }, [logout])

    // Save tokens and refresh user on login
    const login = useCallback((accessToken: string, refreshToken: string) => {
        localStorage.setItem('accessToken', accessToken)
        localStorage.setItem('refreshToken', refreshToken)
        refreshUser()
    }, [refreshUser])

    // Initial load - check if we have a valid session
    useEffect(() => {
        refreshUser()
    }, [refreshUser])

    // Listen for storage changes (e.g., logout in another tab)
    useEffect(() => {
        const handleStorageChange = (e: StorageEvent) => {
            if (e.key === 'accessToken') {
                if (!e.newValue) {
                    // Token was removed
                    setUser(null)
                    setIsLoggedIn(false)
                } else {
                    // Token was added
                    refreshUser()
                }
            }
        }
        window.addEventListener('storage', handleStorageChange)
        return () => window.removeEventListener('storage', handleStorageChange)
    }, [refreshUser])

    return (
        <AuthContext.Provider value={{ user, isLoggedIn, isLoading, login, logout, refreshUser }}>
            {children}
        </AuthContext.Provider>
    )
}

export function useAuth() {
    const context = useContext(AuthContext)
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider')
    }
    return context
}
