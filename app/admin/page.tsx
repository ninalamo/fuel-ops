'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import {
    Truck,
    Users,
    Building2,
    MapPin,
    Fuel,
    Settings,
    ChevronRight,
    Shield
} from 'lucide-react'

interface AdminCard {
    title: string
    description: string
    href: string
    icon: React.ReactNode
    count: number
    color: string
}

export default function AdminPage() {
    const router = useRouter()
    const [userRole, setUserRole] = useState<string | null>(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        const role = localStorage.getItem('userRole')
        setUserRole(role)
        setLoading(false)

        // Redirect non-admins
        if (role && role !== 'admin') {
            router.push('/dashboard')
        }
    }, [router])

    if (loading) {
        return (
            <div className="flex justify-center items-center min-h-[60vh]">
                <div className="animate-spin h-8 w-8 border-4 border-blue-600 border-t-transparent rounded-full" />
            </div>
        )
    }

    if (userRole !== 'admin') {
        return (
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <div className="text-center py-12">
                    <Shield className="h-16 w-16 mx-auto text-red-400 mb-4" />
                    <h2 className="text-xl font-semibold text-gray-900">Access Denied</h2>
                    <p className="text-gray-500 mt-2">You need admin privileges to access this page.</p>
                    <Link href="/dashboard" className="text-blue-600 hover:text-blue-800 mt-4 inline-block">
                        Back to Dashboard
                    </Link>
                </div>
            </div>
        )
    }

    const cards: AdminCard[] = [
        {
            title: 'Tankers',
            description: 'Manage fleet tankers and their compartments',
            href: '/admin/tankers',
            icon: <Truck className="h-8 w-8" />,
            count: 8,
            color: 'blue',
        },
        {
            title: 'Drivers',
            description: 'Manage driver records and assignments',
            href: '/admin/drivers',
            icon: <Users className="h-8 w-8" />,
            count: 12,
            color: 'green',
        },
        {
            title: 'Porters',
            description: 'Manage porter records and assignments',
            href: '/admin/porters',
            icon: <Users className="h-8 w-8" />,
            count: 8,
            color: 'purple',
        },
        {
            title: 'Customers',
            description: 'Manage customer accounts',
            href: '/admin/customers',
            icon: <Building2 className="h-8 w-8" />,
            count: 15,
            color: 'yellow',
        },
        {
            title: 'Stations',
            description: 'Manage delivery stations/sites',
            href: '/admin/stations',
            icon: <MapPin className="h-8 w-8" />,
            count: 42,
            color: 'red',
        },
        {
            title: 'Fuel Types',
            description: 'Manage fuel product types',
            href: '/admin/fuel-types',
            icon: <Fuel className="h-8 w-8" />,
            count: 4,
            color: 'cyan',
        },
    ]

    const colorStyles: Record<string, string> = {
        blue: 'bg-blue-50 text-blue-600 border-blue-100',
        green: 'bg-green-50 text-green-600 border-green-100',
        purple: 'bg-purple-50 text-purple-600 border-purple-100',
        yellow: 'bg-yellow-50 text-yellow-600 border-yellow-100',
        red: 'bg-red-50 text-red-600 border-red-100',
        cyan: 'bg-cyan-50 text-cyan-600 border-cyan-100',
    }

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            {/* Header */}
            <div className="mb-8">
                <div className="flex items-center gap-3 mb-2">
                    <div className="p-2 bg-gray-100 rounded-lg">
                        <Settings className="h-6 w-6 text-gray-600" />
                    </div>
                    <h1 className="text-2xl font-bold text-gray-900">Administration</h1>
                </div>
                <p className="text-gray-500">Manage master data and system configuration</p>
            </div>

            {/* Master Data Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {cards.map((card) => (
                    <Link
                        key={card.title}
                        href={card.href}
                        className="bg-white rounded-xl border border-gray-100 p-6 hover:shadow-lg transition-shadow group"
                    >
                        <div className="flex justify-between items-start mb-4">
                            <div className={`p-3 rounded-xl ${colorStyles[card.color]}`}>
                                {card.icon}
                            </div>
                            <span className="text-2xl font-bold text-gray-900">{card.count}</span>
                        </div>
                        <h3 className="text-lg font-semibold text-gray-900 mb-1 group-hover:text-blue-600 transition-colors">
                            {card.title}
                        </h3>
                        <p className="text-sm text-gray-500 mb-4">{card.description}</p>
                        <div className="flex items-center text-blue-600 text-sm font-medium">
                            Manage
                            <ChevronRight className="h-4 w-4 ml-1 group-hover:translate-x-1 transition-transform" />
                        </div>
                    </Link>
                ))}
            </div>
        </div>
    )
}
