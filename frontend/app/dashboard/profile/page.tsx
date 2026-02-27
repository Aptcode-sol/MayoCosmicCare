"use client"
import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card"
import { Input } from "@/components/ui/Input"
import { Button } from "@/components/ui/Button"
import { me, updateProfile, sendEmailChangeOtp, verifyEmailChange, sendForgotPasswordOtp, resetPasswordWithOtp } from '@/lib/services/auth'
import DashboardLayout from '@/components/DashboardLayout'
import api from '@/lib/api'
import toast from 'react-hot-toast'
import { SkeletonCard } from "@/components/ui/SkeletonCard"

interface UserData {
    id: string
    username: string
    name?: string
    email: string
    phone?: string
    kycStatus?: string
    kycMessage?: string
    pan?: string
    aadhaar?: string
    createdAt?: string
    wallet?: { balance: number }
    sponsor?: { id: string, name?: string, username: string }
}

export default function ProfilePage() {
    const [loading, setLoading] = useState(true)
    const [user, setUser] = useState<UserData | null>(null)

    // Personal Info State
    const [username, setUsername] = useState('')
    const [name, setName] = useState('')
    const [phone, setPhone] = useState('')
    const [savingProfile, setSavingProfile] = useState(false)
    const [isEditingProfile, setIsEditingProfile] = useState(false)

    // Email Change State
    const [emailStep, setEmailStep] = useState<'idle' | 'input' | 'otp'>('idle')
    const [newEmail, setNewEmail] = useState('')
    const [emailOtp, setEmailOtp] = useState('')
    const [sendingEmailOtp, setSendingEmailOtp] = useState(false)
    const [verifyingEmail, setVerifyingEmail] = useState(false)

    // Password Change State
    const [passwordStep, setPasswordStep] = useState<'idle' | 'input' | 'otp'>('idle')
    const [currentPassword, setCurrentPassword] = useState('')
    const [newPassword, setNewPassword] = useState('')
    const [confirmPassword, setConfirmPassword] = useState('')
    const [passwordOtp, setPasswordOtp] = useState('')
    const [sendingPasswordOtp, setSendingPasswordOtp] = useState(false)
    const [changingPassword, setChangingPassword] = useState(false)

    // KYC State
    const [kycStatus, setKycStatus] = useState<string>('NOT_STARTED')
    const [kycDocs, setKycDocs] = useState({ pan: '', aadhaar: '' })
    const [checkingKyc, setCheckingKyc] = useState(false)

    useEffect(() => {
        loadUser()
    }, [])

    const loadUser = async () => {
        try {
            const data = await me()
            if (data.ok && data.user) {
                setUser(data.user)
                setUsername(data.user.username || '')
                setName(data.user.name || '')
                setPhone(data.user.phone || '')
                setKycStatus(data.user.kycStatus || 'NOT_STARTED')
                setKycDocs({
                    pan: data.user.pan || '',
                    aadhaar: data.user.aadhaar || ''
                })
            }
        } catch (err) {
            console.error('Failed to load user', err)
            toast.error('Failed to load profile')
        } finally {
            setLoading(false)
        }
    }

    // ===== PERSONAL INFO =====
    const handleSaveProfile = async () => {
        setSavingProfile(true)
        try {
            const res = await updateProfile({ name, username, phone })
            if (res.ok) {
                toast.success('Profile updated')
                loadUser()
            } else {
                toast.error(res.error || 'Failed to update')
            }
        } catch (err: any) {
            toast.error(err.response?.data?.error || 'Update failed')
        } finally {
            setSavingProfile(false)
            setIsEditingProfile(false)
        }
    }

    // ===== EMAIL CHANGE =====
    const handleSendEmailOtp = async () => {
        if (!newEmail || !newEmail.includes('@')) {
            toast.error('Enter a valid email')
            return
        }
        setSendingEmailOtp(true)
        try {
            await sendEmailChangeOtp(newEmail)
            toast.success('OTP sent to new email')
            setEmailStep('otp')
        } catch (err: any) {
            toast.error(err.response?.data?.error || 'Failed to send OTP')
        } finally {
            setSendingEmailOtp(false)
        }
    }

    const handleVerifyEmailChange = async () => {
        setVerifyingEmail(true)
        try {
            await verifyEmailChange(newEmail, emailOtp)
            toast.success('Email updated successfully!')
            setEmailStep('idle')
            setNewEmail('')
            setEmailOtp('')
            loadUser()
        } catch (err: any) {
            toast.error(err.response?.data?.error || 'Verification failed')
        } finally {
            setVerifyingEmail(false)
        }
    }

    // ===== PASSWORD CHANGE =====
    const handleSendPasswordOtp = async () => {
        if (!user?.email) return
        setSendingPasswordOtp(true)
        try {
            await sendForgotPasswordOtp(user.email)
            toast.success('OTP sent to your email')
            setPasswordStep('otp')
        } catch (err: any) {
            toast.error(err.response?.data?.error || 'Failed to send OTP')
        } finally {
            setSendingPasswordOtp(false)
        }
    }

    const handleChangePassword = async () => {
        if (newPassword !== confirmPassword) {
            toast.error('Passwords do not match')
            return
        }
        if (newPassword.length < 6) {
            toast.error('Password must be at least 6 characters')
            return
        }
        setChangingPassword(true)
        try {
            await resetPasswordWithOtp(user?.email || '', passwordOtp, newPassword)
            toast.success('Password changed successfully!')
            setPasswordStep('idle')
            setCurrentPassword('')
            setNewPassword('')
            setConfirmPassword('')
            setPasswordOtp('')
        } catch (err: any) {
            toast.error(err.response?.data?.error || 'Password change failed')
        } finally {
            setChangingPassword(false)
        }
    }

    // ===== KYC =====
    const handleDoKyc = async () => {
        try {
            toast.loading('Initializing KYC...')
            const res = await api.post('/api/kyc/init')
            toast.dismiss()
            if (res.data.ok && res.data.url) {
                window.location.href = res.data.url
            } else {
                toast.error('Failed to start KYC')
            }
        } catch (err: any) {
            toast.dismiss()
            toast.error(err.response?.data?.error || 'KYC Init failed')
        }
    }

    const handleCheckKycStatus = async () => {
        setCheckingKyc(true)
        try {
            const res = await api.get('/api/kyc/status')
            if (res.data.ok) {
                setKycStatus(res.data.status)
                if (res.data.pan || res.data.aadhaar) {
                    setKycDocs({
                        pan: res.data.pan || kycDocs.pan,
                        aadhaar: res.data.aadhaar || kycDocs.aadhaar
                    })
                }
                if (res.data.status === 'VERIFIED') toast.success('KYC Verified!')
                else if (res.data.status === 'FAILED') toast.error('KYC Failed')
                loadUser()
            }
        } catch (err: any) {
            toast.error(err.response?.data?.error || 'Failed to check status')
            loadUser()
        } finally {
            setCheckingKyc(false)
        }
    }



    if (loading) {
        return (
            <DashboardLayout user={user}>
                <div className="container mx-auto px-2 sm:px-3 lg:px-4 py-8 pt-0 max-w-5xl space-y-8">
                    {/* Header Skeleton */}
                    <div className="space-y-2">
                        <div className="h-8 bg-gray-200 rounded w-1/4 animate-pulse"></div>
                        <div className="h-4 bg-gray-200 rounded w-1/6 animate-pulse"></div>
                    </div>

                    <div className="grid lg:grid-cols-3 gap-6">
                        {/* Left Column Skeleton */}
                        <div className="lg:col-span-1 space-y-6">
                            <SkeletonCard className="h-64 bg-white p-6 rounded-2xl border border-gray-100" />
                            <SkeletonCard className="h-40 bg-white p-6 rounded-2xl border border-gray-100" />
                        </div>

                        {/* Right Column Skeleton */}
                        <div className="lg:col-span-2 space-y-6">
                            <SkeletonCard className="h-40 bg-white p-6 rounded-2xl border border-gray-100" />
                            <SkeletonCard className="h-40 bg-white p-6 rounded-2xl border border-gray-100" />
                            <SkeletonCard className="h-64 bg-white p-6 rounded-2xl border border-gray-100" />
                        </div>
                    </div>
                </div>
            </DashboardLayout>
        )
    }

    const memberSince = user?.createdAt ? new Date(user.createdAt).toLocaleDateString('en-US', { month: 'short', year: 'numeric' }) : 'N/A'

    return (
        <DashboardLayout user={user}>
            <div className="container mx-auto px-2 sm:px-3 lg:px-4 py-8 pt-0 max-w-5xl">
                {/* Page Header */}
                <div className="mb-8">
                    <h1 className="text-2xl font-bold text-gray-900">My Profile</h1>
                    <p className="text-gray-500 text-sm mt-1">Manage your account settings and preferences</p>
                </div>

                <div className="grid lg:grid-cols-3 gap-6">
                    {/* Left Column: Profile Card + KYC */}
                    <div className="lg:col-span-1 space-y-6">
                        {/* Profile Summary Card */}
                        <Card className="overflow-hidden">
                            <div className="bg-[#080808] h-20"></div>
                            <CardContent className="pt-0 -mt-10 text-center">
                                <div className="w-20 h-20 rounded-full bg-white shadow-lg flex items-center justify-center mx-auto mb-4 border-4 border-white">
                                    <span className="text-2xl font-bold text-gray-700">
                                        {(user?.name || user?.username || 'U').slice(0, 2).toUpperCase()}
                                    </span>
                                </div>
                                <h2
                                    className="text-xl font-bold text-gray-900 break-words max-w-full whitespace-pre-line text-center sm:text-left"
                                    style={{ wordBreak: 'break-word', overflowWrap: 'break-word', maxWidth: '100%' }}
                                >
                                    {user?.name || user?.username}
                                </h2>
                                <p className="text-gray-500 text-sm">{user?.username}</p>
                                {user?.phone && <p className="text-gray-400 text-xs mt-1">📱 {user.phone}</p>}

                                <div className="border-t border-gray-100 mt-4 pt-4 space-y-2">
                                    <div className="flex justify-between text-sm">
                                        <span className="text-gray-500">Account Type</span>
                                        <span className="font-medium text-gray-900">Distributor</span>
                                    </div>
                                    <div className="flex justify-between text-sm">
                                        <span className="text-gray-500">Member Since</span>
                                        <span className="font-medium text-gray-900">{memberSince}</span>
                                    </div>
                                    <div className="flex justify-between text-sm">
                                        <span className="text-gray-500">Wallet Balance</span>
                                        <span className="font-bold text-green-600">₹{user?.wallet?.balance?.toLocaleString() || 0}</span>
                                    </div>
                                    <div className="flex justify-between text-sm">
                                        <span className="text-gray-500">Referred By</span>
                                        <span className="font-medium text-gray-900 break-words max-w-[120px] sm:max-w-full whitespace-pre-line" style={{ wordBreak: 'break-word', overflowWrap: 'break-word' }}>
                                            {user?.sponsor ? (user.sponsor.name || user.sponsor.username) : 'N/A'}
                                        </span>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        {/* KYC Card */}
                        <Card>
                            <CardHeader className="pb-2">
                                <CardTitle className="text-base flex items-center gap-2">
                                    <svg className="w-5 h-5 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                                    </svg>
                                    KYC Verification
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="flex items-center justify-between">
                                    <span className="text-sm text-gray-500">Status</span>
                                    <span className={`px-2 py-1 rounded text-xs font-bold uppercase
                                        ${kycStatus === 'VERIFIED' ? 'bg-green-100 text-green-700' :
                                            kycStatus === 'IN_PROGRESS' ? 'bg-yellow-100 text-yellow-700' :
                                                kycStatus === 'FAILED' ? 'bg-red-100 text-red-700' :
                                                    'bg-gray-100 text-gray-700'}`}>
                                        {kycStatus.replace('_', ' ')}
                                    </span>
                                </div>

                                {kycStatus === 'FAILED' && user?.kycMessage && (
                                    <div className="mt-2 text-xs text-red-600 bg-red-50 p-2 rounded border border-red-100">
                                        {user.kycMessage}
                                    </div>
                                )}

                                {kycStatus === 'VERIFIED' ? (
                                    <div className="space-y-2 pt-2 border-t border-gray-50 text-sm">
                                        <div className="flex justify-between">
                                            <span className="text-gray-400">Aadhaar</span>
                                            <span className="font-mono">xxxx-xxxx-{kycDocs.aadhaar?.slice(-4) || 'xxxx'}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-gray-400">PAN</span>
                                            <span className="font-mono">{kycDocs.pan ? kycDocs.pan.slice(0, 2) + 'xxxxx' + kycDocs.pan.slice(-2) : 'xxxxxxxxx'}</span>
                                        </div>
                                    </div>
                                ) : kycStatus === 'IN_PROGRESS' ? (
                                    <div className="space-y-2">
                                        <p className="text-xs text-gray-500">Verification in progress.</p>
                                        <Button variant="outline" size="sm" className="w-full" onClick={handleCheckKycStatus} disabled={checkingKyc}>
                                            {checkingKyc ? 'Checking...' : 'Check Status'}
                                        </Button>
                                    </div>
                                ) : (
                                    <Button className="w-full bg-indigo-600 hover:bg-indigo-700 text-white" onClick={handleDoKyc}>
                                        Complete KYC
                                    </Button>
                                )}
                            </CardContent>
                        </Card>
                    </div>

                    {/* Right Column: Settings */}
                    <div className="lg:col-span-2 space-y-6">
                        {/* Personal Information */}
                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between">
                                <CardTitle className="text-base flex items-center gap-2">
                                    <svg className="w-5 h-5 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                    </svg>
                                    Personal Information
                                </CardTitle>
                                {/* Allow name editing before KYC verification */}
                                {kycStatus !== 'VERIFIED' && !isEditingProfile && (
                                    <Button variant="outline" size="sm" onClick={() => setIsEditingProfile(true)}>
                                        <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                                        </svg>
                                        Edit
                                    </Button>
                                )}
                            </CardHeader>
                            <CardContent>
                                {isEditingProfile ? (
                                    <div className="space-y-4">
                                        <div>
                                            <label className="text-sm font-medium text-gray-700">Full Name</label>
                                            <Input value={name} onChange={e => setName(e.target.value)} className="mt-1" placeholder="Enter your name as per PAN" />
                                            <p className="text-xs text-gray-500 mt-1">Update your name to match your PAN card for KYC verification</p>
                                        </div>
                                        <div className="grid md:grid-cols-2 gap-4">
                                            <div>
                                                <label className="text-sm font-medium text-gray-500">Phone Number</label>
                                                <p className="text-gray-900 font-medium mt-1">{user?.phone || 'Not set'}</p>
                                            </div>
                                            <div>
                                                <label className="text-sm font-medium text-gray-500">Username</label>
                                                <p className="text-gray-900 font-medium mt-1">{user?.username || '-'}</p>
                                            </div>
                                        </div>
                                        <div className="flex justify-end gap-2">
                                            <Button variant="outline" onClick={() => { setIsEditingProfile(false); setName(user?.name || ''); }}>
                                                Cancel
                                            </Button>
                                            <Button onClick={handleSaveProfile} disabled={savingProfile} className="bg-indigo-600 hover:bg-indigo-700 text-white">
                                                {savingProfile ? 'Saving...' : 'Save Changes'}
                                            </Button>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="grid md:grid-cols-2 gap-4">
                                        <div>
                                            <label className="text-sm font-medium text-gray-500">Full Name</label>
                                            <p className="text-gray-900 font-medium mt-1">{user?.name || '-'}</p>
                                        </div>
                                        <div>
                                            <label className="text-sm font-medium text-gray-500">Phone Number</label>
                                            <p className="text-gray-900 font-medium mt-1">{user?.phone || 'Not set'}</p>
                                        </div>
                                        <div>
                                            <label className="text-sm font-medium text-gray-500">Username</label>
                                            <p className="text-gray-900 font-medium mt-1">{user?.username || '-'}</p>
                                        </div>
                                    </div>
                                )}
                            </CardContent>
                        </Card>

                        {/* Change Email */}
                        <Card>
                            <CardHeader>
                                <CardTitle className="text-base flex items-center gap-2">
                                    <svg className="w-5 h-5 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                                    </svg>
                                    Email Address
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                {emailStep === 'idle' && (
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <p className="font-medium text-gray-900">{user?.email}</p>
                                            <p className="text-xs text-gray-500">Verified email address</p>
                                        </div>
                                        <Button variant="outline" onClick={() => setEmailStep('input')}>
                                            Change Email
                                        </Button>
                                    </div>
                                )}

                                {emailStep === 'input' && (
                                    <div className="space-y-4">
                                        <div>
                                            <label className="text-sm font-medium text-gray-700">New Email Address</label>
                                            <Input type="email" value={newEmail} onChange={e => setNewEmail(e.target.value)} placeholder="newemail@example.com" className="mt-1" />
                                        </div>
                                        <div className="flex gap-2">
                                            <Button variant="outline" onClick={() => { setEmailStep('idle'); setNewEmail('') }}>Cancel</Button>
                                            <Button onClick={handleSendEmailOtp} disabled={sendingEmailOtp} className="bg-indigo-600 hover:bg-indigo-700 text-white">
                                                {sendingEmailOtp ? 'Sending...' : 'Send OTP'}
                                            </Button>
                                        </div>
                                    </div>
                                )}

                                {emailStep === 'otp' && (
                                    <div className="space-y-4">
                                        <p className="text-sm text-gray-600">Enter the OTP sent to <strong>{newEmail}</strong></p>
                                        <Input type="text" maxLength={6} value={emailOtp} onChange={e => setEmailOtp(e.target.value.replace(/\D/g, ''))} placeholder="000000" className="text-center text-xl font-mono tracking-widest" />
                                        <div className="flex gap-2">
                                            <Button variant="outline" onClick={() => { setEmailStep('idle'); setNewEmail(''); setEmailOtp('') }}>Cancel</Button>
                                            <Button onClick={handleVerifyEmailChange} disabled={verifyingEmail || emailOtp.length !== 6} className="bg-indigo-600 hover:bg-indigo-700 text-white">
                                                {verifyingEmail ? 'Verifying...' : 'Verify & Update'}
                                            </Button>
                                        </div>
                                    </div>
                                )}
                            </CardContent>
                        </Card>

                        {/* Change Password */}
                        <Card>
                            <CardHeader>
                                <CardTitle className="text-base flex items-center gap-2">
                                    <svg className="w-5 h-5 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                                    </svg>
                                    Password
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                {passwordStep === 'idle' && (
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <p className="font-medium text-gray-900">••••••••••••</p>
                                            <p className="text-xs text-gray-500">Last changed: Unknown</p>
                                        </div>
                                        <Button variant="outline" onClick={() => setPasswordStep('input')}>
                                            Change Password
                                        </Button>
                                    </div>
                                )}

                                {passwordStep === 'input' && (
                                    <div className="space-y-4">
                                        <p className="text-sm text-gray-500">We'll send an OTP to your email to verify your identity.</p>
                                        <div className="flex gap-2">
                                            <Button variant="outline" onClick={() => setPasswordStep('idle')}>Cancel</Button>
                                            <Button onClick={handleSendPasswordOtp} disabled={sendingPasswordOtp} className="bg-indigo-600 hover:bg-indigo-700 text-white">
                                                {sendingPasswordOtp ? 'Sending...' : 'Send OTP'}
                                            </Button>
                                        </div>
                                    </div>
                                )}

                                {passwordStep === 'otp' && (
                                    <div className="space-y-4">
                                        <div>
                                            <label className="text-sm font-medium text-gray-700">OTP Code</label>
                                            <Input type="text" maxLength={6} value={passwordOtp} onChange={e => setPasswordOtp(e.target.value.replace(/\D/g, ''))} placeholder="000000" className="mt-1 text-center text-xl font-mono tracking-widest" />
                                        </div>
                                        <div>
                                            <label className="text-sm font-medium text-gray-700">New Password</label>
                                            <Input type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)} placeholder="••••••••" className="mt-1" />
                                        </div>
                                        <div>
                                            <label className="text-sm font-medium text-gray-700">Confirm New Password</label>
                                            <Input type="password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} placeholder="••••••••" className="mt-1" />
                                        </div>
                                        <div className="flex gap-2">
                                            <Button variant="outline" onClick={() => { setPasswordStep('idle'); setPasswordOtp(''); setNewPassword(''); setConfirmPassword('') }}>Cancel</Button>
                                            <Button onClick={handleChangePassword} disabled={changingPassword || passwordOtp.length !== 6} className="bg-indigo-600 hover:bg-indigo-700 text-white">
                                                {changingPassword ? 'Changing...' : 'Change Password'}
                                            </Button>
                                        </div>
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </div>
        </DashboardLayout>
    )
}
