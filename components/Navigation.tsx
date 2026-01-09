'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Fuel, LogOut } from 'lucide-react'
import { useEffect, useState } from 'react'

type UserRole = 'encoder' | 'supervisor' | 'admin'

interface User {
    name: string
    role: UserRole
}

export function Navigation() {
    const pathname = usePathname()
    const [user, setUser] = useState<User | null>(null)
    const [mounted, setMounted] = useState(false)

    useEffect(() => {
        setMounted(true)
        const checkUser = () => {
            const role = localStorage.getItem('userRole') as UserRole | null
            const name = localStorage.getItem('userName')
            if (role && name) {
                setUser({ name, role })
            } else {
                setUser(null)
            }
        }

        checkUser()

        // Listen for storage changes (cross-tab)
        window.addEventListener('storage', checkUser)
        // Listen for custom event (same-tab login/logout)
        window.addEventListener('user-auth-change', checkUser)

        return () => {
            window.removeEventListener('storage', checkUser)
            window.removeEventListener('user-auth-change', checkUser)
        }
    }, [])

    const handleLogout = () => {
        localStorage.removeItem('userRole')
        localStorage.removeItem('userName')
        // Dispatch event for same-tab updates
        window.dispatchEvent(new Event('user-auth-change'))
        window.location.href = '/login'
    }

    // Don't show nav on login page
    if (pathname === '/login') {
        return null
    }

    // Wait for client-side mount
    if (!mounted) {
        return (
            <nav className="bg-blue-950 text-white h-16" />
        )
    }

    const getRoleLabel = (role: UserRole) => {
        const labels: Record<UserRole, string> = {
            encoder: 'Encoder',
            supervisor: 'Supervisor',
            admin: 'Admin',
        }
        return labels[role] || role
    }

    return (
        <nav className="bg-blue-950 text-white">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between items-center h-16">
                    {/* Logo & App Name */}
                    <Link href="/dashboard" className="flex items-center gap-3">
                        <div className="p-2 bg-blue-800 rounded-lg">
                            <Fuel className="h-5 w-5 text-blue-200" />
                        </div>
                        <span className="font-bold text-xl">FuelOps</span>
                    </Link>

                    {/* Center Navigation Tabs */}
                    <div className="flex items-center gap-2">
                        <NavTab href="/fleet-status" label="Dashboard" isActive={pathname === '/fleet-status'} />
                        <NavTab
                            href="/dashboard"
                            label={user?.role === 'supervisor' ? 'Fleet Review' : 'Fleet Status'}
                            isActive={pathname === '/dashboard' || pathname.startsWith('/tanker-days')}
                        />
                        {user?.role !== 'encoder' && (
                            <NavTab href="/trips" label="Trips" isActive={pathname === '/trips'} />
                        )}
                        {user?.role !== 'encoder' && (
                            <NavTab href="/reports" label="Reports" isActive={pathname.startsWith('/reports')} />
                        )}
                        {user?.role === 'admin' && (
                            <NavTab href="/admin" label="Admin" isActive={pathname.startsWith('/admin')} />
                        )}
                    </div>

                    {/* User Profile */}
                    {user && (
                        <div className="flex items-center gap-4">
                            <div className="text-right">
                                <div className="text-sm font-medium">{user.name}</div>
                                <div className="text-xs text-blue-300">{getRoleLabel(user.role)}</div>
                            </div>
                            <button
                                onClick={handleLogout}
                                className="flex items-center gap-2 px-3 py-1.5 text-sm bg-blue-800 hover:bg-blue-700 rounded-lg transition-colors"
                            >
                                <LogOut className="h-4 w-4" />
                                Logout
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </nav>
    )
}

function NavTab({ href, label, isActive }: { href: string; label: string; isActive: boolean }) {
    return (
        <Link
            href={href}
            className={`px-4 py-2 text-sm font-medium rounded-full transition-colors ${isActive
                ? 'bg-blue-600 text-white'
                : 'bg-blue-900/50 hover:bg-blue-800 text-blue-100'
                }`}
        >
            {label}
        </Link>
    )
}
