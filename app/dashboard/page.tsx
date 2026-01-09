'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { format } from 'date-fns'
import {
    Truck,
    MapPin,
    Clock,
    CheckCircle,
    FileText,
    AlertCircle,
    Eye,
    ChevronRight,
    Upload,
    XCircle
} from 'lucide-react'

interface DashboardStats {
    tankerDays: {
        total: number
        open: number
        submitted: number
        locked: number
    }
    trips: {
        total: number
        pending: number
        enRoute: number
        returned: number
        completed: number
    }
    pods: {
        pendingReview: number
        approved: number
        rejected: number
    }
    litersDelivered: number
}

export default function DashboardPage() {
    const [stats, setStats] = useState<DashboardStats | null>(null)
    const [loading, setLoading] = useState(true)
    const [userRole, setUserRole] = useState<string | null>(null)

    useEffect(() => {
        const role = localStorage.getItem('userRole')
        setUserRole(role)
        fetchDashboardData()
    }, [])

    const fetchDashboardData = async () => {
        setLoading(true)
        try {
            const today = format(new Date(), 'yyyy-MM-dd')

            // Fetch tanker days
            const tdRes = await fetch(`/api/tanker-days?date=${today}`)
            const tdData = await tdRes.json()
            const tankerDays = tdData.tankerDays || []

            // Fetch trips
            const tripsRes = await fetch(`http://localhost:3001/trips?date=${today}`)
            const trips = await tripsRes.json()

            // Fetch PODs
            const podsRes = await fetch('http://localhost:3001/pods')
            const pods = await podsRes.json()

            // Calculate stats
            setStats({
                tankerDays: {
                    total: tankerDays.length,
                    open: tankerDays.filter((td: any) => td.status === 'OPEN').length,
                    submitted: tankerDays.filter((td: any) => td.status === 'SUBMITTED').length,
                    locked: tankerDays.filter((td: any) => td.status === 'LOCKED').length,
                },
                trips: {
                    total: trips.length,
                    pending: trips.filter((t: any) => t.status === 'PENDING').length,
                    enRoute: trips.filter((t: any) => t.status === 'EN_ROUTE').length,
                    returned: trips.filter((t: any) => t.status === 'RETURNED').length,
                    completed: trips.filter((t: any) => t.status === 'COMPLETED').length,
                },
                pods: {
                    pendingReview: pods.filter((p: any) => p.status === 'PENDING_REVIEW').length,
                    approved: pods.filter((p: any) => p.status === 'APPROVED').length,
                    rejected: pods.filter((p: any) => p.status === 'REJECTED').length,
                },
                litersDelivered: trips
                    .filter((t: any) => t.status === 'COMPLETED')
                    .reduce((sum: number, t: any) => sum + (t.quantity || 0), 0),
            })
        } catch (error) {
            console.error('Error fetching dashboard data:', error)
        } finally {
            setLoading(false)
        }
    }

    if (loading || !stats) {
        return (
            <div className="flex justify-center items-center min-h-[60vh]">
                <div className="animate-spin h-8 w-8 border-4 border-blue-600 border-t-transparent rounded-full" />
            </div>
        )
    }

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            {/* Header */}
            <div className="mb-8">
                <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
                <p className="text-gray-500 mt-1">
                    {format(new Date(), 'EEEE, MMMM d, yyyy')} — Operations Overview
                </p>
            </div>

            {/* Main Stats Grid */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                {/* Trips Today */}
                <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm">
                    <div className="flex items-center gap-3 mb-3">
                        <div className="p-2 bg-blue-100 rounded-lg">
                            <MapPin className="h-5 w-5 text-blue-600" />
                        </div>
                        <span className="text-sm font-medium text-gray-500">Trips Today</span>
                    </div>
                    <div className="text-3xl font-bold text-gray-900">{stats.trips.total}</div>
                    <div className="text-xs text-gray-500 mt-1">
                        {stats.trips.completed} completed, {stats.trips.returned} awaiting POD
                    </div>
                </div>

                {/* Liters Delivered */}
                <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm">
                    <div className="flex items-center gap-3 mb-3">
                        <div className="p-2 bg-green-100 rounded-lg">
                            <CheckCircle className="h-5 w-5 text-green-600" />
                        </div>
                        <span className="text-sm font-medium text-gray-500">Delivered</span>
                    </div>
                    <div className="text-3xl font-bold text-green-700">{stats.litersDelivered.toLocaleString()}L</div>
                    <div className="text-xs text-gray-500 mt-1">
                        From {stats.trips.completed} completed trips
                    </div>
                </div>

                {/* PODs Pending Review */}
                <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm">
                    <div className="flex items-center gap-3 mb-3">
                        <div className="p-2 bg-yellow-100 rounded-lg">
                            <Eye className="h-5 w-5 text-yellow-600" />
                        </div>
                        <span className="text-sm font-medium text-gray-500">PODs Pending</span>
                    </div>
                    <div className="text-3xl font-bold text-yellow-700">{stats.pods.pendingReview}</div>
                    <div className="text-xs text-gray-500 mt-1">
                        Awaiting supervisor review
                    </div>
                </div>

                {/* Active Tankers */}
                <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm">
                    <div className="flex items-center gap-3 mb-3">
                        <div className="p-2 bg-purple-100 rounded-lg">
                            <Truck className="h-5 w-5 text-purple-600" />
                        </div>
                        <span className="text-sm font-medium text-gray-500">Active Tankers</span>
                    </div>
                    <div className="text-3xl font-bold text-purple-700">{stats.tankerDays.total}</div>
                    <div className="text-xs text-gray-500 mt-1">
                        {stats.tankerDays.open} open, {stats.tankerDays.submitted} submitted
                    </div>
                </div>
            </div>

            {/* Status Breakdown */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
                {/* Trip Status */}
                <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
                    <h3 className="font-semibold text-gray-900 mb-4">Trip Status Breakdown</h3>
                    <div className="space-y-3">
                        <StatusRow label="Pending" count={stats.trips.pending} color="gray" icon={Clock} />
                        <StatusRow label="En Route" count={stats.trips.enRoute} color="blue" icon={Truck} />
                        <StatusRow label="Returned (Awaiting POD)" count={stats.trips.returned} color="orange" icon={Upload} />
                        <StatusRow label="Completed" count={stats.trips.completed} color="green" icon={CheckCircle} />
                    </div>
                </div>

                {/* POD Review Status */}
                <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
                    <h3 className="font-semibold text-gray-900 mb-4">POD Review Status</h3>
                    <div className="space-y-3">
                        <StatusRow label="Pending Review" count={stats.pods.pendingReview} color="yellow" icon={Eye} />
                        <StatusRow label="Approved" count={stats.pods.approved} color="green" icon={CheckCircle} />
                        <StatusRow label="Rejected" count={stats.pods.rejected} color="red" icon={XCircle} />
                    </div>
                    {userRole === 'supervisor' && stats.pods.pendingReview > 0 && (
                        <Link
                            href="/fleet-status"
                            className="mt-4 inline-flex items-center gap-2 text-sm text-blue-600 hover:text-blue-700 font-medium"
                        >
                            Review pending PODs <ChevronRight className="h-4 w-4" />
                        </Link>
                    )}
                </div>
            </div>

            {/* Quick Actions */}
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
                <h3 className="font-semibold text-gray-900 mb-4">Quick Actions</h3>
                <div className="flex flex-wrap gap-3">
                    <Link
                        href="/fleet-status"
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 flex items-center gap-2"
                    >
                        <Truck className="h-4 w-4" />
                        View Tanker Operations
                    </Link>
                    {userRole !== 'encoder' && (
                        <Link
                            href="/trips"
                            className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-200 flex items-center gap-2"
                        >
                            <MapPin className="h-4 w-4" />
                            View All Trips
                        </Link>
                    )}
                    {stats.trips.returned > 0 && userRole === 'encoder' && (
                        <Link
                            href="/fleet-status"
                            className="px-4 py-2 bg-orange-100 text-orange-700 rounded-lg text-sm font-medium hover:bg-orange-200 flex items-center gap-2"
                        >
                            <AlertCircle className="h-4 w-4" />
                            {stats.trips.returned} trips need POD upload
                        </Link>
                    )}
                </div>
            </div>
        </div>
    )
}

function StatusRow({ label, count, color, icon: Icon }: { label: string; count: number; color: string; icon: any }) {
    const colorClasses: Record<string, string> = {
        gray: 'bg-gray-100 text-gray-700',
        blue: 'bg-blue-100 text-blue-700',
        orange: 'bg-orange-100 text-orange-700',
        green: 'bg-green-100 text-green-700',
        yellow: 'bg-yellow-100 text-yellow-700',
        red: 'bg-red-100 text-red-700',
    }

    return (
        <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
                <Icon className={`h-4 w-4 ${colorClasses[color]?.split(' ')[1] || 'text-gray-500'}`} />
                <span className="text-sm text-gray-600">{label}</span>
            </div>
            <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${colorClasses[color]}`}>
                {count}
            </span>
        </div>
    )
}
