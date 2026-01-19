"use client"
import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card"
import { Input } from "@/components/ui/Input"
import { Button } from "@/components/ui/Button"
import { me, updateProfile } from '@/lib/services/auth'
import DashboardLayout from '@/components/DashboardLayout'

export default function ProfilePage() {
    const [loading, setLoading] = useState(true)
    const [submitting, setSubmitting] = useState(false)
    const [formData, setFormData] = useState({
        username: '',
        email: '',
        phone: '',
        password: '',
        confirmNewPassword: '',
        currentPassword: ''
    })
    const [error, setError] = useState('')
    const [success, setSuccess] = useState('')

    useEffect(() => {
        loadUser()
    }, [])

    const loadUser = async () => {
        try {
            const data = await me()
            if (data.ok && data.user) {
                setFormData(prev => ({
                    ...prev,
                    username: data.user.username || '',
                    email: data.user.email || '',
                    phone: data.user.phone || ''
                }))
            }
        } catch (err: any) {
            console.error('Failed to load user', err)
        } finally {
            setLoading(false)
        }
    }

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target
        setFormData(prev => ({ ...prev, [name]: value }))
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setError('')
        setSuccess('')
        setSubmitting(true)

        try {
            // Password confirmation check
            if (formData.password && formData.password !== formData.confirmNewPassword) {
                setError('New passwords do not match')
                setSubmitting(false)
                return
            }

            // Only send fields that have values (simple check, backend handles verification)
            const payload: Record<string, any> = {
                username: formData.username,
                email: formData.email,
                phone: formData.phone
            }

            if (formData.password) {
                payload.password = formData.password
                payload.currentPassword = formData.currentPassword
            }

            const res = await updateProfile(payload)
            if (res.ok) {
                setSuccess('Profile updated successfully')
                // Clear password fields on success
                setFormData(prev => ({ ...prev, password: '', confirmNewPassword: '', currentPassword: '' }))
            } else {
                if (res.errors) {
                    setError(Object.values(res.errors).join(', '))
                } else if (res.error) {
                    setError(res.error)
                } else {
                    setError('Failed to update profile')
                }
            }
        } catch (err: any) {
            setError(err.response?.data?.error || err.message || 'An error occurred')
        } finally {
            setSubmitting(false)
        }
    }

    if (loading) {
        return (
            <DashboardLayout>
                <div className="p-8 text-center text-gray-500">Loading profile...</div>
            </DashboardLayout>
        )
    }

    return (
        <DashboardLayout>
            <div className="container mx-auto px-4 py-8 pt-0">
                <h1 className="text-2xl font-bold mb-6 text-gray-800">My Profile</h1>

                <div className="grid md:grid-cols-3 gap-6">
                    {/* Profile Card */}
                    <div className="md:col-span-1">
                        <Card className="shadow-sm border-gray-100 h-full">
                            <CardContent className="p-6 flex flex-col items-center text-center">
                                <div className="w-24 h-24 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white text-3xl font-bold mb-4 shadow-lg">
                                    {(formData.username || 'U').slice(0, 2).toUpperCase()}
                                </div>
                                <h2 className="text-xl font-bold text-gray-900">{formData.username}</h2>
                                <p className="text-gray-500 text-sm mb-4">{formData.email}</p>

                                <div className="w-full border-t border-gray-100 pt-4 mt-2">
                                    <div className="flex justify-between text-sm py-2">
                                        <span className="text-gray-500">Account Type</span>
                                        <span className="font-medium text-gray-900">Distributor</span>
                                    </div>
                                    <div className="flex justify-between text-sm py-2">
                                        <span className="text-gray-500">Member Since</span>
                                        <span className="font-medium text-gray-900">Jan 2024</span>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Edit Form */}
                    <div className="md:col-span-2">
                        <Card className="shadow-sm border-gray-100">
                            <CardHeader>
                                <CardTitle>Edit Details</CardTitle>
                            </CardHeader>
                            <CardContent>
                                {error && (
                                    <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm mb-4">
                                        {error}
                                    </div>
                                )}
                                {success && (
                                    <div className="bg-green-50 text-green-600 p-3 rounded-lg text-sm mb-4">
                                        {success}
                                    </div>
                                )}

                                <form onSubmit={handleSubmit} className="space-y-4">
                                    <div className="grid md:grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <label className="text-sm font-medium text-gray-700">Username</label>
                                            <Input
                                                name="username"
                                                value={formData.username}
                                                onChange={handleChange}
                                                placeholder="Enter username"
                                                required
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-sm font-medium text-gray-700">Email Address</label>
                                            <Input
                                                name="email"
                                                type="email"
                                                value={formData.email}
                                                onChange={handleChange}
                                                placeholder="Enter email"
                                                required
                                            />
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <label className="text-sm font-medium text-gray-700">Phone Number</label>
                                        <Input
                                            name="phone"
                                            value={formData.phone}
                                            onChange={handleChange}
                                            placeholder="Enter phone number"
                                        />
                                    </div>

                                    <div className="pt-4 border-t border-gray-100 mt-4">
                                        <h4 className="text-sm font-semibold text-gray-900 mb-3">Change Password</h4>
                                        <p className="text-xs text-gray-500 mb-4">Leave blank if you don't want to change your password.</p>

                                        <div className="space-y-4">
                                            <div className="space-y-2">
                                                <label className="text-sm font-medium text-gray-700">New Password</label>
                                                <Input
                                                    name="password"
                                                    type="password"
                                                    value={formData.password}
                                                    onChange={handleChange}
                                                    placeholder="New password"
                                                    minLength={6}
                                                />
                                            </div>

                                            {formData.password && (
                                                <div className="space-y-2 animate-in fade-in slide-in-from-top-2 duration-300">
                                                    <label className="text-sm font-medium text-gray-700">Confirm New Password</label>
                                                    <Input
                                                        name="confirmNewPassword"
                                                        type="password"
                                                        value={formData.confirmNewPassword}
                                                        onChange={handleChange}
                                                        placeholder="Confirm new password"
                                                        required
                                                    />
                                                </div>
                                            )}

                                            {formData.password && (
                                                <div className="space-y-2 animate-in fade-in slide-in-from-top-2 duration-300">
                                                    <label className="text-sm font-medium text-gray-700">Old Password (Required)</label>
                                                    <Input
                                                        name="currentPassword"
                                                        type="password"
                                                        value={formData.currentPassword}
                                                        onChange={handleChange}
                                                        placeholder="Enter old password"
                                                        required
                                                    />
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    <div className="pt-4 flex justify-end">
                                        <Button
                                            type="submit"
                                            disabled={submitting}
                                            className="bg-indigo-600 hover:bg-indigo-700 text-white"
                                        >
                                            {submitting ? 'Saving...' : 'Save Changes'}
                                        </Button>
                                    </div>
                                </form>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </div>
        </DashboardLayout>
    )
}
