'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { format } from 'date-fns'
import {
    Truck,
    MapPin,
    Clock,
    CheckCircle,
    Play,
    RotateCcw,
    Eye,
    Fuel,
    ChevronRight
} from 'lucide-react'

interface FleetTanker {
    id: string
    plateNumber: string
    driver: string
    porter: string
    status: 'AT_DEPOT' | 'IN_TRANSIT' | 'DELIVERING' | 'RETURNING'
    lastTrip?: {
        station: string
        departedAt: string
        returnedAt?: string
    }
    currentQuantities: Record<string, { compartmentName: string; product: string; quantity: number; maxVolume: number }>
    tripsCompleted: number
    totalTrips: number
    totalDelivered: number
    tankerDayId: string
    tankerDayStatus: string
}

// Mock fleet data
const MOCK_FLEET: FleetTanker[] = [
    {
        id: 'tanker-1',
        plateNumber: 'ABC-1234',
        driver: 'Juan Cruz',
        porter: 'Carlos Lopez',
        status: 'AT_DEPOT',
        lastTrip: { station: 'Shell EDSA', departedAt: '2026-01-06T08:00:00', returnedAt: '2026-01-06T10:30:00' },
        currentQuantities: {
            c1: { compartmentName: 'C1', product: 'DIESEL', quantity: 5000, maxVolume: 7500 },
            c2: { compartmentName: 'C2', product: 'DIESEL', quantity: 4800, maxVolume: 7500 },
            c3: { compartmentName: 'C3', product: 'UNLEADED', quantity: 6200, maxVolume: 7500 },
            c4: { compartmentName: 'C4', product: 'UNLEADED', quantity: 7000, maxVolume: 7500 },
        },
        tripsCompleted: 2,
        totalTrips: 3,
        totalDelivered: 8100,
        tankerDayId: 'td-2026-01-06-tanker-1',
        tankerDayStatus: 'OPEN',
    },
    {
        id: 'tanker-2',
        plateNumber: 'XYZ-5678',
        driver: 'Pedro Santos',
        porter: 'Ana Mendez',
        status: 'IN_TRANSIT',
        lastTrip: { station: 'Petron Makati', departedAt: '2026-01-06T09:45:00' },
        currentQuantities: {
            c1: { compartmentName: 'C1', product: 'DIESEL', quantity: 8500, maxVolume: 8500 },
            c2: { compartmentName: 'C2', product: 'DIESEL', quantity: 8500, maxVolume: 8500 },
            c3: { compartmentName: 'C3', product: 'UNLEADED', quantity: 8000, maxVolume: 8000 },
        },
        tripsCompleted: 1,
        totalTrips: 4,
        totalDelivered: 4500,
        tankerDayId: 'td-2026-01-06-tanker-2',
        tankerDayStatus: 'OPEN',
    },
    {
        id: 'tanker-3',
        plateNumber: 'DEF-9012',
        driver: 'Maria Garcia',
        porter: 'Luis Torres',
        status: 'DELIVERING',
        lastTrip: { station: 'Caltex BGC', departedAt: '2026-01-06T11:00:00' },
        currentQuantities: {
            c1: { compartmentName: 'C1', product: 'DIESEL', quantity: 3000, maxVolume: 10000 },
            c2: { compartmentName: 'C2', product: 'DIESEL', quantity: 2500, maxVolume: 10000 },
        },
        tripsCompleted: 0,
        totalTrips: 2,
        totalDelivered: 0,
        tankerDayId: 'td-2026-01-06-tanker-3',
        tankerDayStatus: 'OPEN',
    },
    {
        id: 'tanker-4',
        plateNumber: 'GHI-3456',
        driver: 'Jose Reyes',
        porter: 'Rosa Fernandez',
        status: 'AT_DEPOT',
        currentQuantities: {
            c1: { compartmentName: 'C1', product: 'DIESEL', quantity: 0, maxVolume: 7000 },
            c2: { compartmentName: 'C2', product: 'DIESEL', quantity: 0, maxVolume: 7000 },
            c3: { compartmentName: 'C3', product: 'UNLEADED', quantity: 0, maxVolume: 7000 },
            c4: { compartmentName: 'C4', product: 'UNLEADED', quantity: 0, maxVolume: 7000 },
            c5: { compartmentName: 'C5', product: 'PREMIUM', quantity: 0, maxVolume: 7000 },
        },
        tripsCompleted: 5,
        totalTrips: 5,
        totalDelivered: 32000,
        tankerDayId: 'td-2026-01-06-tanker-4',
        tankerDayStatus: 'SUBMITTED',
    },
]

export default function FleetStatusPage() {
    const [fleet, setFleet] = useState<FleetTanker[]>([])
    const [loading, setLoading] = useState(true)
    const [userRole, setUserRole] = useState<string | null>(null)

    useEffect(() => {
        const role = localStorage.getItem('userRole')
        setUserRole(role)
        // Simulate API call
        setTimeout(() => {
            setFleet(MOCK_FLEET)
            setLoading(false)
        }, 500)
    }, [])

    const getStatusBadge = (status: string) => {
        const styles: Record<string, { bg: string; icon: typeof Clock }> = {
            AT_DEPOT: { bg: 'bg-gray-100 text-gray-700', icon: Clock },
            IN_TRANSIT: { bg: 'bg-blue-100 text-blue-700', icon: Play },
            DELIVERING: { bg: 'bg-yellow-100 text-yellow-700', icon: MapPin },
            RETURNING: { bg: 'bg-orange-100 text-orange-700', icon: RotateCcw },
        }
        const style = styles[status] || styles.AT_DEPOT
        const Icon = style.icon
        return (
            <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium ${style.bg}`}>
                <Icon className="h-3 w-3" />
                {status.replace('_', ' ')}
            </span>
        )
    }

    const getTotalsPerFuelType = (quantities: FleetTanker['currentQuantities']) => {
        const totals: Record<string, { current: number; max: number }> = {}
        Object.values(quantities).forEach(q => {
            if (!totals[q.product]) {
                totals[q.product] = { current: 0, max: 0 }
            }
            totals[q.product].current += q.quantity
            totals[q.product].max += q.maxVolume
        })
        return totals
    }

    const getProductColor = (product: string) => {
        switch (product) {
            case 'DIESEL': return 'bg-blue-500'
            case 'UNLEADED': case 'UNLEADED 91': case 'UNLEADED 95': return 'bg-green-500'
            case 'PREMIUM': return 'bg-purple-500'
            default: return 'bg-gray-500'
        }
    }

    // Summary stats
    const atDepot = fleet.filter(t => t.status === 'AT_DEPOT').length
    const inTransit = fleet.filter(t => t.status === 'IN_TRANSIT' || t.status === 'DELIVERING' || t.status === 'RETURNING').length
    const totalDeliveredToday = fleet.reduce((sum, t) => sum + t.totalDelivered, 0)

    if (loading) {
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
                <p className="text-gray-500 mt-1">Real-time tanker locations and fuel quantities</p>
            </div>

            {/* Summary Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                <div className="bg-white p-5 rounded-xl border border-gray-100">
                    <div className="text-3xl font-bold text-gray-900">{fleet.length}</div>
                    <div className="text-sm text-gray-500 font-medium">Total Tankers</div>
                </div>
                <div className="bg-gray-50 p-5 rounded-xl border border-gray-200">
                    <div className="text-3xl font-bold text-gray-700">{atDepot}</div>
                    <div className="text-sm text-gray-500 font-medium">At Depot</div>
                </div>
                <div className="bg-blue-50 p-5 rounded-xl border border-blue-200">
                    <div className="text-3xl font-bold text-blue-700">{inTransit}</div>
                    <div className="text-sm text-blue-600 font-medium">In Transit</div>
                </div>
                <div className="bg-green-50 p-5 rounded-xl border border-green-200">
                    <div className="text-3xl font-bold text-green-700">{totalDeliveredToday.toLocaleString()}L</div>
                    <div className="text-sm text-green-600 font-medium">Delivered Today</div>
                </div>
            </div>

            {/* Fleet Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {fleet.map((tanker) => {
                    const fuelTotals = getTotalsPerFuelType(tanker.currentQuantities)
                    return (
                        <div key={tanker.id} className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
                            {/* Tanker Header */}
                            <div className="p-4 border-b border-gray-100 flex justify-between items-center">
                                <div className="flex items-center gap-3">
                                    <div className={`p-2 rounded-lg ${tanker.status === 'AT_DEPOT' ? 'bg-gray-100' : 'bg-blue-100'}`}>
                                        <Truck className={`h-6 w-6 ${tanker.status === 'AT_DEPOT' ? 'text-gray-600' : 'text-blue-600'}`} />
                                    </div>
                                    <div>
                                        <div className="font-bold text-gray-900">{tanker.plateNumber}</div>
                                        <div className="text-xs text-gray-500">{tanker.driver} / {tanker.porter}</div>
                                    </div>
                                </div>
                                {getStatusBadge(tanker.status)}
                            </div>

                            {/* Last Trip Info */}
                            {tanker.lastTrip && (
                                <div className={`px-4 py-2 text-sm ${tanker.lastTrip.returnedAt ? 'bg-green-50' : 'bg-yellow-50'}`}>
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                            <MapPin className={`h-4 w-4 ${tanker.lastTrip.returnedAt ? 'text-green-600' : 'text-yellow-600'}`} />
                                            <span className="font-medium text-gray-900">{tanker.lastTrip.station}</span>
                                        </div>
                                        <div className="text-xs text-gray-500">
                                            {tanker.lastTrip.returnedAt
                                                ? `Returned ${format(new Date(tanker.lastTrip.returnedAt), 'h:mm a')}`
                                                : `Departed ${format(new Date(tanker.lastTrip.departedAt), 'h:mm a')}`
                                            }
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Fuel Totals by Type */}
                            <div className="p-4 space-y-3">
                                <div className="text-xs font-semibold text-gray-500 uppercase">Current Fuel Levels</div>
                                {Object.entries(fuelTotals).map(([product, totals]) => (
                                    <div key={product} className="flex items-center gap-3">
                                        <div className={`w-3 h-3 rounded-full ${getProductColor(product)}`} />
                                        <div className="flex-1">
                                            <div className="flex justify-between text-sm mb-1">
                                                <span className="font-medium text-gray-700">{product}</span>
                                                <span className="text-gray-500">{totals.current.toLocaleString()} / {totals.max.toLocaleString()} L</span>
                                            </div>
                                            <div className="w-full bg-gray-200 rounded-full h-2">
                                                <div
                                                    className={`h-2 rounded-full ${getProductColor(product)}`}
                                                    style={{ width: `${(totals.current / totals.max) * 100}%` }}
                                                />
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            {/* Compartment Breakdown */}
                            <div className="px-4 pb-4">
                                <details className="group">
                                    <summary className="text-xs text-blue-600 cursor-pointer hover:text-blue-800 flex items-center gap-1">
                                        <Fuel className="h-3 w-3" />
                                        View compartment details
                                    </summary>
                                    <div className="mt-2 grid grid-cols-2 gap-2">
                                        {Object.entries(tanker.currentQuantities).map(([id, comp]) => (
                                            <div key={id} className="flex justify-between items-center p-2 bg-gray-50 rounded text-xs">
                                                <div className="flex items-center gap-1">
                                                    <div className={`w-2 h-2 rounded-full ${getProductColor(comp.product)}`} />
                                                    <span className="font-medium">{comp.compartmentName}</span>
                                                </div>
                                                <span className="text-gray-600">{comp.quantity.toLocaleString()}L</span>
                                            </div>
                                        ))}
                                    </div>
                                </details>
                            </div>

                            {/* Trip Progress & Actions */}
                            <div className="px-4 py-3 border-t border-gray-100 bg-gray-50 flex justify-between items-center">
                                <div className="text-sm">
                                    <span className="text-gray-500">Trips:</span>
                                    <span className="font-bold text-gray-900 ml-1">{tanker.tripsCompleted}/{tanker.totalTrips}</span>
                                    <span className="text-gray-400 mx-2">•</span>
                                    <span className="text-gray-500">Delivered:</span>
                                    <span className="font-bold text-gray-900 ml-1">{tanker.totalDelivered.toLocaleString()}L</span>
                                </div>
                                <Link
                                    href={`/tanker-days/${tanker.tankerDayId}`}
                                    className="text-blue-600 hover:text-blue-800 text-sm font-medium flex items-center gap-1"
                                >
                                    <Eye className="h-4 w-4" />
                                    {userRole === 'supervisor' && tanker.tankerDayStatus === 'SUBMITTED' ? 'Review' : 'Details'}
                                    <ChevronRight className="h-4 w-4" />
                                </Link>
                            </div>
                        </div>
                    )
                })}
            </div>
        </div>
    )
}
