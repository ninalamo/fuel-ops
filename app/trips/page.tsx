'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { format } from 'date-fns'
import {
    ArrowLeft,
    Calendar,
    Truck,
    User,
    MapPin,
    ChevronRight,
    Filter,
    CheckCircle,
    Clock,
    AlertTriangle
} from 'lucide-react'

interface Trip {
    id: string
    tankerDayId: string
    date: string
    tripNumber: number
    tanker: string
    driver: string
    porter: string
    customer: string
    station: string
    products: string[]
    quantity: number
    status: 'PENDING' | 'DEPARTED' | 'DELIVERED' | 'RETURNED'
    departedAt: string | null
    deliveredAt: string | null
    hasPod: boolean
    hasException: boolean
}

export default function TripsPage() {
    const [trips, setTrips] = useState<Trip[]>([])
    const [loading, setLoading] = useState(true)
    const [dateFrom, setDateFrom] = useState(format(new Date(), 'yyyy-MM-dd'))
    const [dateTo, setDateTo] = useState(format(new Date(), 'yyyy-MM-dd'))
    const [statusFilter, setStatusFilter] = useState<string>('all')
    const [tankerFilter, setTankerFilter] = useState<string>('all')

    useEffect(() => {
        fetchTrips()
    }, [dateFrom, dateTo])

    const fetchTrips = async () => {
        setLoading(true)
        try {
            const res = await fetch(`/api/trips?dateFrom=${dateFrom}&dateTo=${dateTo}`)
            const data = await res.json()
            setTrips(data)
        } catch (error) {
            console.error('Error fetching trips:', error)
        } finally {
            setLoading(false)
        }
    }

    const getStatusBadge = (status: string) => {
        const styles: Record<string, string> = {
            PENDING: 'bg-gray-100 text-gray-700',
            DEPARTED: 'bg-blue-100 text-blue-700',
            DELIVERED: 'bg-green-100 text-green-700',
            RETURNED: 'bg-purple-100 text-purple-700',
        }
        const icons: Record<string, typeof Clock> = {
            PENDING: Clock,
            DEPARTED: Truck,
            DELIVERED: CheckCircle,
            RETURNED: CheckCircle,
        }
        const Icon = icons[status] || Clock
        return (
            <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${styles[status] || styles.PENDING}`}>
                <Icon className="h-3 w-3" />
                {status}
            </span>
        )
    }

    // Get unique tankers for filter
    const uniqueTankers = [...new Set(trips.map(t => t.tanker))]

    // Apply filters
    const filteredTrips = trips.filter(trip => {
        if (statusFilter !== 'all' && trip.status !== statusFilter) return false
        if (tankerFilter !== 'all' && trip.tanker !== tankerFilter) return false
        return true
    })

    // Stats
    const stats = {
        total: filteredTrips.length,
        pending: filteredTrips.filter(t => t.status === 'PENDING').length,
        departed: filteredTrips.filter(t => t.status === 'DEPARTED').length,
        delivered: filteredTrips.filter(t => t.status === 'DELIVERED' || t.status === 'RETURNED').length,
        totalLiters: filteredTrips.reduce((sum, t) => sum + (t.status === 'DELIVERED' || t.status === 'RETURNED' ? t.quantity : 0), 0),
    }

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            {/* Header */}
            <div className="flex flex-wrap justify-between items-start gap-4 mb-6">
                <div>
                    <Link
                        href="/dashboard"
                        className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-2"
                    >
                        <ArrowLeft className="h-4 w-4" />
                        Back to Dashboard
                    </Link>
                    <h1 className="text-2xl font-bold text-gray-900">All Trips</h1>
                    <p className="text-gray-500">View all trips in a flat list for a date range</p>
                </div>
            </div>

            {/* Filters */}
            <div className="bg-white rounded-xl border border-gray-100 p-4 mb-6">
                <div className="flex flex-wrap gap-4 items-end">
                    {/* Date Range */}
                    <div>
                        <label className="block text-xs font-medium text-gray-500 mb-1">From</label>
                        <div className="flex items-center gap-2 px-3 py-2 border border-gray-200 rounded-lg bg-white">
                            <Calendar className="h-4 w-4 text-gray-400" />
                            <input
                                type="date"
                                value={dateFrom}
                                onChange={(e) => setDateFrom(e.target.value)}
                                className="text-sm border-0 bg-transparent focus:outline-none"
                            />
                        </div>
                    </div>
                    <div>
                        <label className="block text-xs font-medium text-gray-500 mb-1">To</label>
                        <div className="flex items-center gap-2 px-3 py-2 border border-gray-200 rounded-lg bg-white">
                            <Calendar className="h-4 w-4 text-gray-400" />
                            <input
                                type="date"
                                value={dateTo}
                                onChange={(e) => setDateTo(e.target.value)}
                                className="text-sm border-0 bg-transparent focus:outline-none"
                            />
                        </div>
                    </div>

                    {/* Status Filter */}
                    <div>
                        <label className="block text-xs font-medium text-gray-500 mb-1">Status</label>
                        <select
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value)}
                            className="px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white"
                        >
                            <option value="all">All Statuses</option>
                            <option value="PENDING">Pending</option>
                            <option value="DEPARTED">Departed</option>
                            <option value="DELIVERED">Delivered</option>
                            <option value="RETURNED">Returned</option>
                        </select>
                    </div>

                    {/* Tanker Filter */}
                    <div>
                        <label className="block text-xs font-medium text-gray-500 mb-1">Tanker</label>
                        <select
                            value={tankerFilter}
                            onChange={(e) => setTankerFilter(e.target.value)}
                            className="px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white"
                        >
                            <option value="all">All Tankers</option>
                            {uniqueTankers.map(tanker => (
                                <option key={tanker} value={tanker}>{tanker}</option>
                            ))}
                        </select>
                    </div>

                    {/* Quick Stats */}
                    <div className="ml-auto flex gap-4 text-sm">
                        <div className="text-center">
                            <div className="font-bold text-gray-900">{stats.total}</div>
                            <div className="text-xs text-gray-500">Total</div>
                        </div>
                        <div className="text-center">
                            <div className="font-bold text-yellow-600">{stats.pending}</div>
                            <div className="text-xs text-gray-500">Pending</div>
                        </div>
                        <div className="text-center">
                            <div className="font-bold text-blue-600">{stats.departed}</div>
                            <div className="text-xs text-gray-500">In Transit</div>
                        </div>
                        <div className="text-center">
                            <div className="font-bold text-green-600">{stats.delivered}</div>
                            <div className="text-xs text-gray-500">Delivered</div>
                        </div>
                        <div className="text-center">
                            <div className="font-bold text-gray-900">{stats.totalLiters.toLocaleString()}</div>
                            <div className="text-xs text-gray-500">Liters</div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Trips Table */}
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
                {loading ? (
                    <div className="flex justify-center py-12">
                        <div className="animate-spin h-8 w-8 border-4 border-blue-600 border-t-transparent rounded-full" />
                    </div>
                ) : filteredTrips.length === 0 ? (
                    <div className="text-center py-12">
                        <MapPin className="h-12 w-12 mx-auto text-gray-300 mb-4" />
                        <h3 className="text-lg font-medium text-gray-900 mb-2">No Trips Found</h3>
                        <p className="text-gray-500">No trips match your current filters.</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead>
                                <tr className="border-b border-gray-100 bg-gray-50">
                                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Date</th>
                                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Trip #</th>
                                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Tanker</th>
                                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Driver</th>
                                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Customer / Station</th>
                                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Product</th>
                                    <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500 uppercase">Qty (L)</th>
                                    <th className="px-4 py-3 text-center text-xs font-semibold text-gray-500 uppercase">Status</th>
                                    <th className="px-4 py-3 text-center text-xs font-semibold text-gray-500 uppercase">POD</th>
                                    <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500 uppercase">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50">
                                {filteredTrips.map((trip) => (
                                    <tr key={trip.id} className="hover:bg-gray-50 transition-colors">
                                        <td className="px-4 py-3 text-sm text-gray-600">
                                            {format(new Date(trip.date), 'MMM d')}
                                        </td>
                                        <td className="px-4 py-3">
                                            <span className="font-mono text-sm font-medium text-gray-900">
                                                #{trip.tripNumber}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3">
                                            <div className="flex items-center gap-2">
                                                <Truck className="h-4 w-4 text-blue-500" />
                                                <span className="text-sm font-medium text-gray-900">{trip.tanker}</span>
                                            </div>
                                        </td>
                                        <td className="px-4 py-3">
                                            <div className="text-sm text-gray-900">{trip.driver}</div>
                                            <div className="text-xs text-gray-500">{trip.porter}</div>
                                        </td>
                                        <td className="px-4 py-3">
                                            <div className="text-sm font-medium text-gray-900">{trip.customer}</div>
                                            <div className="text-xs text-gray-500 flex items-center gap-1">
                                                <MapPin className="h-3 w-3" />
                                                {trip.station}
                                            </div>
                                        </td>
                                        <td className="px-4 py-3">
                                            <div className="flex flex-wrap gap-1">
                                                {trip.products.map((product, idx) => (
                                                    <span
                                                        key={idx}
                                                        className={`text-xs font-medium px-2 py-0.5 rounded ${product === 'DIESEL' ? 'bg-blue-50 text-blue-700' :
                                                            product === 'UNLEADED 91' ? 'bg-green-50 text-green-700' :
                                                                product === 'UNLEADED 95' ? 'bg-amber-50 text-amber-700' :
                                                                    'bg-purple-50 text-purple-700'
                                                            }`}
                                                    >
                                                        {product}
                                                    </span>
                                                ))}
                                            </div>
                                        </td>
                                        <td className="px-4 py-3 text-right">
                                            <span className="text-sm font-medium text-gray-900">
                                                {trip.quantity.toLocaleString()}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3 text-center">
                                            {getStatusBadge(trip.status)}
                                        </td>
                                        <td className="px-4 py-3 text-center">
                                            {trip.hasPod ? (
                                                <CheckCircle className="h-5 w-5 text-green-500 mx-auto" />
                                            ) : trip.status === 'DELIVERED' || trip.status === 'RETURNED' ? (
                                                <AlertTriangle className="h-5 w-5 text-orange-500 mx-auto" />
                                            ) : (
                                                <span className="text-gray-300">—</span>
                                            )}
                                        </td>
                                        <td className="px-4 py-3 text-right">
                                            <Link
                                                href={`/trips/${trip.id}`}
                                                className="inline-flex items-center gap-1 text-blue-600 hover:text-blue-800 text-sm"
                                            >
                                                View
                                                <ChevronRight className="h-4 w-4" />
                                            </Link>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    )
}
