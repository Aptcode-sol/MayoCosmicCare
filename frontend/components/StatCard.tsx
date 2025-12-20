interface StatCardProps {
    title: string
    value: string | number
    subtitle?: string
    icon?: 'users' | 'money' | 'chart' | 'arrow-up' | 'arrow-down'
    trend?: { value: number; positive: boolean }
    variant?: 'default' | 'primary' | 'success' | 'warning'
}

const iconPaths: Record<string, string> = {
    users: 'M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z',
    money: 'M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z',
    chart: 'M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z',
    'arrow-up': 'M7 11l5-5m0 0l5 5m-5-5v12',
    'arrow-down': 'M17 13l-5 5m0 0l-5-5m5 5V6',
}

const variantStyles: Record<string, { bg: string; icon: string; text: string }> = {
    default: { bg: 'bg-gray-100', icon: 'text-gray-600', text: 'text-gray-900' },
    primary: { bg: 'bg-blue-50', icon: 'text-blue-600', text: 'text-blue-900' },
    success: { bg: 'bg-emerald-50', icon: 'text-emerald-600', text: 'text-emerald-900' },
    warning: { bg: 'bg-amber-50', icon: 'text-amber-600', text: 'text-amber-900' },
}

export default function StatCard({ title, value, subtitle, icon = 'chart', trend, variant = 'default' }: StatCardProps) {
    const styles = variantStyles[variant]

    return (
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
            <div className="flex items-start justify-between mb-4">
                <div className={`w-12 h-12 ${styles.bg} rounded-xl flex items-center justify-center`}>
                    <svg className={`w-6 h-6 ${styles.icon}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d={iconPaths[icon]} />
                    </svg>
                </div>
                {trend && (
                    <div className={`flex items-center gap-1 text-sm font-medium ${trend.positive ? 'text-emerald-600' : 'text-red-600'}`}>
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={trend.positive ? iconPaths['arrow-up'] : iconPaths['arrow-down']} />
                        </svg>
                        {trend.value}%
                    </div>
                )}
            </div>
            <div>
                <p className="text-sm font-medium text-gray-500 uppercase tracking-wider mb-1">{title}</p>
                <p className={`text-3xl font-light ${styles.text} tracking-tight`}>{value}</p>
                {subtitle && <p className="text-sm text-gray-500 mt-1">{subtitle}</p>}
            </div>
        </div>
    )
}
