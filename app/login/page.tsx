'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Fuel, User, Lock } from 'lucide-react'

// Demo users with predefined roles
const DEMO_USERS = [
    { email: 'john@fuelops.com', password: 'demo123', name: 'John Encoder', role: 'encoder' },
    { email: 'maria@fuelops.com', password: 'demo123', name: 'Maria Validator', role: 'validator' },
    { email: 'carlos@fuelops.com', password: 'demo123', name: 'Carlos Supervisor', role: 'supervisor' },
    { email: 'admin@fuelops.com', password: 'demo123', name: 'System Admin', role: 'admin' },
]

export default function LoginPage() {
    const router = useRouter()
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [error, setError] = useState('')
    const [isLoading, setIsLoading] = useState(false)

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault()
        setError('')
        setIsLoading(true)

        // Find matching demo user
        const user = DEMO_USERS.find(
            u => u.email.toLowerCase() === email.toLowerCase() && u.password === password
        )

        if (user) {
            // Store user info (in real app, this would be a JWT from Supabase)
            localStorage.setItem('userRole', user.role)
            localStorage.setItem('userName', user.name)
            localStorage.setItem('userEmail', user.email)

            await new Promise(resolve => setTimeout(resolve, 500))
            router.push('/dashboard')
        } else {
            setError('Invalid email or password')
            setIsLoading(false)
        }
    }

    const quickLogin = (user: typeof DEMO_USERS[0]) => {
        setEmail(user.email)
        setPassword(user.password)
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-950 via-blue-900 to-slate-900 flex items-center justify-center p-4">
            <div className="w-full max-w-md">
                <div className="bg-white rounded-2xl shadow-2xl p-8">
                    {/* Header */}
                    <div className="text-center mb-8">
                        <div className="inline-flex items-center justify-center p-4 bg-blue-100 rounded-2xl mb-4">
                            <Fuel className="h-10 w-10 text-blue-600" />
                        </div>
                        <h1 className="text-2xl font-bold text-gray-900">FuelOps</h1>
                        <p className="text-gray-500 mt-1">Sign in to your account</p>
                    </div>

                    {/* Login Form */}
                    <form onSubmit={handleLogin} className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Email
                            </label>
                            <div className="relative">
                                <User className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                                <input
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    placeholder="Enter your email"
                                    className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    required
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Password
                            </label>
                            <div className="relative">
                                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                                <input
                                    type="password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    placeholder="Enter your password"
                                    className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    required
                                />
                            </div>
                        </div>

                        {error && (
                            <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                                {error}
                            </div>
                        )}

                        <button
                            type="submit"
                            disabled={isLoading}
                            className="w-full py-3 px-4 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
                        >
                            {isLoading ? (
                                <span className="flex items-center justify-center gap-2">
                                    <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                    Signing in...
                                </span>
                            ) : (
                                'Sign In'
                            )}
                        </button>
                    </form>

                    {/* Demo Users */}
                    <div className="mt-8 pt-6 border-t border-gray-100">
                        <p className="text-xs text-gray-500 text-center mb-4">
                            Demo Accounts (password: demo123)
                        </p>
                        <div className="grid grid-cols-2 gap-2">
                            {DEMO_USERS.map(user => (
                                <button
                                    key={user.email}
                                    onClick={() => quickLogin(user)}
                                    className="p-2 text-left rounded-lg border border-gray-100 hover:border-blue-200 hover:bg-blue-50 transition-colors"
                                >
                                    <div className="text-xs font-medium text-gray-900">{user.name}</div>
                                    <div className="text-xs text-gray-500">{user.role}</div>
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
