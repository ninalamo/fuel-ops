'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { format } from 'date-fns'
import {
    ArrowLeft,
    Truck,
    User,
    Fuel,
    MapPin,
    Camera,
    Clock,
    Lock,
    Send,
    AlertTriangle,
    CheckCircle,
    Plus,
    FileText,
    ChevronDown,
    ChevronUp
} from 'lucide-react'
import { Modal } from '@/components/Modal'

// Mock compartment configuration for this tanker
const TANKER_COMPARTMENTS = [
    { id: 'c1', name: 'C1', maxVolume: 7500, product: 'DIESEL' },
    { id: 'c2', name: 'C2', maxVolume: 7500, product: 'DIESEL' },
    { id: 'c3', name: 'C3', maxVolume: 7500, product: 'UNLEADED' },
    { id: 'c4', name: 'C4', maxVolume: 7500, product: 'UNLEADED' },
]

interface TripDetail {
    id: string
    tripNumber: number
    driver: string
    porter: string
    customer: string
    station: string
    product: string
    status: 'PENDING' | 'DEPARTED' | 'RETURNED'
    departedAt: string | null
    returnedAt: string | null
    plannedQty: number
    actualQty: number | null
    variance: number | null
    hasPod: boolean
    compartmentAllocation: Array<{ compartmentId: string; name: string; plannedQty: number; actualQty: number | null }>
}

interface TankerDayDetail {
    id: string
    date: string
    plateNumber: string
    driver: string
    porter: string
    status: string
    trips: TripDetail[]
    timeline: Array<{
        id: string
        type: 'SNAPSHOT' | 'REFILL' | 'TRIP'
        title: string
        description: string
        details?: string
        timestamp: string
        status: 'COMPLETED' | 'IN_PROGRESS' | 'PENDING'
    }>
    summary: {
        totalPlanned: number
        totalDelivered: number
        totalVariance: number
        tripsCompleted: number
        totalTrips: number
        exceptions: number
    }
}

export default function TankerDayDetailPage() {
    const params = useParams()
    const [data, setData] = useState<TankerDayDetail | null>(null)
    const [loading, setLoading] = useState(true)
    const [userRole, setUserRole] = useState<string | null>(null)
    const [expandedTrip, setExpandedTrip] = useState<string | null>(null)

    // Modal states
    const [showSnapshotModal, setShowSnapshotModal] = useState(false)
    const [showRefillModal, setShowRefillModal] = useState(false)
    const [showTripModal, setShowTripModal] = useState(false)

    // Trip form state - per-compartment allocation
    const [tripCompartments, setTripCompartments] = useState<Record<string, number>>(
        Object.fromEntries(TANKER_COMPARTMENTS.map(c => [c.id, 0]))
    )

    useEffect(() => {
        const role = localStorage.getItem('userRole')
        setUserRole(role)
        fetchData()
    }, [params.id])

    const fetchData = async () => {
        setLoading(true)
        try {
            const res = await fetch(`/api/tanker-days/${params.id}`)
            const result = await res.json()
            setData(result)
        } catch (error) {
            console.error('Error fetching tanker day:', error)
        } finally {
            setLoading(false)
        }
    }

    const canPerformOperations = userRole === 'encoder' || userRole === 'admin'
    const canApprove = userRole === 'validator' || userRole === 'supervisor' || userRole === 'admin'

    const getTotalTripQty = () => Object.values(tripCompartments).reduce((a, b) => a + b, 0)

    const getStatusBadge = (status: string) => {
        const styles: Record<string, string> = {
            OPEN: 'bg-blue-100 text-blue-700',
            SUBMITTED: 'bg-yellow-100 text-yellow-700',
            LOCKED: 'bg-green-50 text-green-600',
            PENDING: 'bg-gray-100 text-gray-700',
            DEPARTED: 'bg-blue-100 text-blue-700',
            RETURNED: 'bg-green-100 text-green-700',
        }
        return (
            <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium ${styles[status] || styles.OPEN}`}>
                {status === 'LOCKED' && <Lock className="h-3 w-3" />}
                {status === 'RETURNED' && <CheckCircle className="h-3 w-3" />}
                {status}
            </span>
        )
    }

    const getTimelineIcon = (type: string) => {
        switch (type) {
            case 'SNAPSHOT': return <Camera className="h-5 w-5 text-blue-600" />
            case 'REFILL': return <Fuel className="h-5 w-5 text-green-600" />
            case 'TRIP': return <MapPin className="h-5 w-5 text-yellow-600" />
            default: return <Clock className="h-5 w-5 text-gray-600" />
        }
    }

    const getTimelineBg = (type: string) => {
        switch (type) {
            case 'SNAPSHOT': return 'bg-blue-50'
            case 'REFILL': return 'bg-green-50'
            case 'TRIP': return 'bg-yellow-50'
            default: return 'bg-gray-50'
        }
    }

    if (loading) {
        return (
            <div className="flex justify-center items-center min-h-[60vh]">
                <div className="animate-spin h-8 w-8 border-4 border-blue-600 border-t-transparent rounded-full" />
            </div>
        )
    }

    if (!data) {
        return (
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <div className="text-center py-12">
                    <h2 className="text-xl font-semibold text-gray-900">Tanker Day not found</h2>
                    <Link href="/dashboard" className="text-blue-600 hover:text-blue-800 mt-4 inline-block">
                        Back to Dashboard
                    </Link>
                </div>
            </div>
        )
    }

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            {/* Back Link */}
            <Link
                href="/dashboard"
                className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6"
            >
                <ArrowLeft className="h-4 w-4" />
                Back to Dashboard
            </Link>

            {/* Header */}
            <div className="flex flex-wrap justify-between items-start gap-4 mb-8">
                <div className="flex items-center gap-4">
                    <div className="p-3 bg-blue-100 rounded-xl">
                        <Truck className="h-8 w-8 text-blue-600" />
                    </div>
                    <div>
                        <div className="flex items-center gap-3 mb-1">
                            <h1 className="text-2xl font-bold text-gray-900">{data.plateNumber}</h1>
                            {getStatusBadge(data.status)}
                        </div>
                        <p className="text-gray-500">
                            {format(new Date(data.date), 'EEEE, MMMM d, yyyy')}
                        </p>
                    </div>
                </div>
                <div className="flex gap-3">
                    {data.status === 'OPEN' && canPerformOperations && (
                        <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium text-sm flex items-center gap-2">
                            <Send className="h-4 w-4" />
                            Submit for Review
                        </button>
                    )}
                    {data.status === 'SUBMITTED' && canApprove && (
                        <>
                            <button className="px-4 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors font-medium text-sm">
                                Return
                            </button>
                            <button className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium text-sm flex items-center gap-2">
                                <Lock className="h-4 w-4" />
                                Approve & Lock
                            </button>
                        </>
                    )}
                </div>
            </div>

            {/* Main Content Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Left Column - Operations & Trips */}
                <div className="lg:col-span-2 space-y-6">
                    {/* Operations Actions - Only for Encoder/Admin */}
                    {canPerformOperations && data.status === 'OPEN' && (
                        <div className="bg-white rounded-xl border border-gray-100 p-6">
                            <h3 className="font-semibold text-gray-900 mb-4">Operations</h3>
                            <div className="grid grid-cols-3 gap-4">
                                <button
                                    onClick={() => setShowSnapshotModal(true)}
                                    className="flex flex-col items-center justify-center p-4 rounded-xl bg-blue-50 hover:bg-blue-100 transition-colors group"
                                >
                                    <Camera className="h-8 w-8 text-blue-600 mb-2 group-hover:scale-110 transition-transform" />
                                    <span className="text-sm font-medium text-gray-700">Snapshot</span>
                                </button>
                                <button
                                    onClick={() => setShowRefillModal(true)}
                                    className="flex flex-col items-center justify-center p-4 rounded-xl bg-green-50 hover:bg-green-100 transition-colors group"
                                >
                                    <Fuel className="h-8 w-8 text-green-600 mb-2 group-hover:scale-110 transition-transform" />
                                    <span className="text-sm font-medium text-gray-700">Refill</span>
                                </button>
                                <button
                                    onClick={() => setShowTripModal(true)}
                                    className="flex flex-col items-center justify-center p-4 rounded-xl bg-yellow-50 hover:bg-yellow-100 transition-colors group"
                                >
                                    <MapPin className="h-8 w-8 text-yellow-600 mb-2 group-hover:scale-110 transition-transform" />
                                    <span className="text-sm font-medium text-gray-700">New Trip</span>
                                </button>
                            </div>
                        </div>
                    )}

                    {/* Trips List with Details */}
                    <div className="bg-white rounded-xl border border-gray-100 p-6">
                        <h3 className="font-semibold text-gray-900 mb-4">Trips ({data.trips.length})</h3>
                        <div className="space-y-3">
                            {data.trips.map((trip) => (
                                <div key={trip.id} className="border border-gray-100 rounded-lg overflow-hidden">
                                    {/* Trip Header */}
                                    <button
                                        onClick={() => setExpandedTrip(expandedTrip === trip.id ? null : trip.id)}
                                        className="w-full flex items-center justify-between p-4 hover:bg-gray-50 transition-colors"
                                    >
                                        <div className="flex items-center gap-4">
                                            <div className="w-8 h-8 rounded-full bg-yellow-100 flex items-center justify-center text-yellow-700 font-bold text-sm">
                                                #{trip.tripNumber}
                                            </div>
                                            <div className="text-left">
                                                <div className="font-medium text-gray-900">{trip.station}</div>
                                                <div className="text-xs text-gray-500">{trip.customer}</div>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-4">
                                            <div className="text-right">
                                                {trip.actualQty !== null ? (
                                                    <>
                                                        <div className="text-sm text-gray-500">
                                                            Planned: {trip.plannedQty.toLocaleString()}L
                                                        </div>
                                                        <div className="text-sm font-bold text-gray-900">
                                                            Actual: {trip.actualQty.toLocaleString()}L
                                                            {trip.variance !== null && trip.variance !== 0 && (
                                                                <span className={`ml-2 text-xs font-medium ${trip.variance < 0 ? 'text-red-600' : 'text-green-600'}`}>
                                                                    ({trip.variance > 0 ? '+' : ''}{trip.variance}L)
                                                                </span>
                                                            )}
                                                        </div>
                                                    </>
                                                ) : (
                                                    <div className="text-sm font-medium text-gray-600">
                                                        Planned: {trip.plannedQty.toLocaleString()}L
                                                    </div>
                                                )}
                                            </div>
                                            {getStatusBadge(trip.status)}
                                            {trip.hasPod && <FileText className="h-4 w-4 text-green-500" />}
                                            {expandedTrip === trip.id ? <ChevronUp className="h-4 w-4 text-gray-400" /> : <ChevronDown className="h-4 w-4 text-gray-400" />}
                                        </div>
                                    </button>

                                    {/* Expanded Trip Details */}
                                    {expandedTrip === trip.id && (
                                        <div className="border-t border-gray-100 p-4 bg-gray-50">
                                            <div className="grid grid-cols-2 gap-4 text-sm mb-4">
                                                <div>
                                                    <span className="text-gray-500">Driver:</span> {trip.driver}
                                                </div>
                                                <div>
                                                    <span className="text-gray-500">Porter:</span> {trip.porter}
                                                </div>
                                                <div>
                                                    <span className="text-gray-500">Product:</span> {trip.product}
                                                </div>
                                                <div>
                                                    <span className="text-gray-500">POD:</span> {trip.hasPod ? '✓ Uploaded' : 'Missing'}
                                                </div>
                                            </div>

                                            {/* Compartment Allocation */}
                                            {trip.compartmentAllocation && trip.compartmentAllocation.length > 0 && (
                                                <div className="mt-4">
                                                    <h4 className="text-xs font-semibold text-gray-500 uppercase mb-2">Compartment Allocation</h4>
                                                    <div className="grid grid-cols-2 gap-2">
                                                        {trip.compartmentAllocation.map(ca => (
                                                            <div key={ca.compartmentId} className="flex justify-between items-center p-2 bg-white rounded border border-gray-100">
                                                                <span className="font-medium text-gray-700">{ca.name}</span>
                                                                <div className="text-right">
                                                                    <div className="text-sm text-gray-900">
                                                                        {ca.actualQty !== null ? `${ca.actualQty.toLocaleString()}L` : `${ca.plannedQty.toLocaleString()}L`}
                                                                    </div>
                                                                    {ca.actualQty !== null && ca.actualQty !== ca.plannedQty && (
                                                                        <div className="text-xs text-gray-500">
                                                                            (planned: {ca.plannedQty.toLocaleString()}L)
                                                                        </div>
                                                                    )}
                                                                </div>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Timeline */}
                    <div className="bg-white rounded-xl border border-gray-100 p-6">
                        <h3 className="font-semibold text-gray-900 mb-4">Timeline</h3>
                        <div className="space-y-4">
                            {data.timeline.map((event, idx) => (
                                <div key={event.id} className="flex gap-4">
                                    <div className="flex flex-col items-center">
                                        <div className={`p-2 rounded-lg ${getTimelineBg(event.type)}`}>
                                            {getTimelineIcon(event.type)}
                                        </div>
                                        {idx < data.timeline.length - 1 && (
                                            <div className="w-0.5 h-full bg-gray-200 mt-2" />
                                        )}
                                    </div>
                                    <div className="flex-1 pb-6">
                                        <div className="flex justify-between items-start">
                                            <div>
                                                <div className="font-medium text-gray-900">{event.title}</div>
                                                <div className="text-sm text-gray-500">{event.description}</div>
                                                {event.details && (
                                                    <div className="text-xs text-gray-400 mt-1">{event.details}</div>
                                                )}
                                            </div>
                                            <div className="text-sm text-gray-400">
                                                {format(new Date(event.timestamp), 'h:mm a')}
                                            </div>
                                        </div>
                                        {event.status === 'COMPLETED' && (
                                            <div className="mt-2 inline-flex items-center gap-1 text-green-600 text-xs">
                                                <CheckCircle className="h-3 w-3" />
                                                Completed
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Right Column - Summary */}
                <div className="space-y-6">
                    {/* Default Crew */}
                    <div className="bg-white rounded-xl border border-gray-100 p-6">
                        <h3 className="font-semibold text-gray-900 mb-4">Default Crew</h3>
                        <p className="text-xs text-gray-500 mb-3">Each trip may assign different crew</p>
                        <div className="space-y-3">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-blue-50 rounded-lg">
                                    <User className="h-4 w-4 text-blue-600" />
                                </div>
                                <div>
                                    <div className="text-xs text-gray-500">Driver</div>
                                    <div className="text-sm font-medium text-gray-900">{data.driver}</div>
                                </div>
                            </div>
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-green-50 rounded-lg">
                                    <User className="h-4 w-4 text-green-600" />
                                </div>
                                <div>
                                    <div className="text-xs text-gray-500">Porter</div>
                                    <div className="text-sm font-medium text-gray-900">{data.porter}</div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Summary */}
                    <div className="bg-white rounded-xl border border-gray-100 p-6">
                        <h3 className="font-semibold text-gray-900 mb-4">Summary</h3>
                        <div className="space-y-4">
                            <div className="flex justify-between items-center">
                                <span className="text-gray-500">Total Planned</span>
                                <span className="font-bold text-gray-900">{data.summary.totalPlanned.toLocaleString()} L</span>
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="text-gray-500">Total Delivered</span>
                                <span className="font-bold text-gray-900">{data.summary.totalDelivered.toLocaleString()} L</span>
                            </div>
                            {data.summary.totalVariance !== 0 && (
                                <div className={`flex justify-between items-center ${data.summary.totalVariance < 0 ? 'text-red-600' : 'text-green-600'}`}>
                                    <span>Variance</span>
                                    <span className="font-bold">{data.summary.totalVariance > 0 ? '+' : ''}{data.summary.totalVariance.toLocaleString()} L</span>
                                </div>
                            )}
                            <div className="border-t border-gray-100 pt-4">
                                <div className="flex justify-between items-center">
                                    <span className="text-gray-500">Trips</span>
                                    <span className="font-bold text-gray-900">{data.summary.tripsCompleted}/{data.summary.totalTrips}</span>
                                </div>
                            </div>
                            {data.summary.exceptions > 0 && (
                                <div className="flex justify-between items-center text-red-600">
                                    <span className="flex items-center gap-1">
                                        <AlertTriangle className="h-4 w-4" />
                                        Exceptions
                                    </span>
                                    <span className="font-bold">{data.summary.exceptions}</span>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Tanker Compartments Info */}
                    <div className="bg-white rounded-xl border border-gray-100 p-6">
                        <h3 className="font-semibold text-gray-900 mb-4">Compartments</h3>
                        <div className="space-y-3">
                            {TANKER_COMPARTMENTS.map(comp => (
                                <div key={comp.id} className="flex justify-between items-center">
                                    <div className="flex items-center gap-2">
                                        <div className={`w-3 h-3 rounded-full ${comp.product === 'DIESEL' ? 'bg-blue-500' : 'bg-green-500'}`} />
                                        <span className="font-medium text-gray-700">{comp.name}</span>
                                    </div>
                                    <div className="text-sm text-gray-500">
                                        {comp.maxVolume.toLocaleString()}L max • {comp.product}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            {/* Snapshot Modal */}
            <Modal
                isOpen={showSnapshotModal}
                onClose={() => setShowSnapshotModal(false)}
                title="Record Snapshot"
            >
                <div className="space-y-4">
                    <p className="text-sm text-gray-600">
                        Record the current fuel levels in all compartments.
                    </p>
                    {TANKER_COMPARTMENTS.map((comp) => (
                        <div key={comp.id}>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                {comp.name} - {comp.product} (Max: {comp.maxVolume.toLocaleString()}L)
                            </label>
                            <input
                                type="number"
                                className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500"
                                placeholder="Enter liters"
                            />
                        </div>
                    ))}
                    <div className="flex gap-3 pt-4">
                        <button
                            onClick={() => setShowSnapshotModal(false)}
                            className="flex-1 px-4 py-2 border border-gray-200 rounded-lg hover:bg-gray-50"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={() => setShowSnapshotModal(false)}
                            className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                        >
                            Save Snapshot
                        </button>
                    </div>
                </div>
            </Modal>

            {/* Refill Modal */}
            <Modal
                isOpen={showRefillModal}
                onClose={() => setShowRefillModal(false)}
                title="Record Refill"
            >
                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Depot</label>
                        <select className="w-full px-3 py-2 border border-gray-200 rounded-lg">
                            <option>Depot Manila</option>
                            <option>Depot Batangas</option>
                            <option>Depot Laguna</option>
                        </select>
                    </div>
                    {TANKER_COMPARTMENTS.map((comp) => (
                        <div key={comp.id}>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                {comp.name} - {comp.product}
                            </label>
                            <input
                                type="number"
                                className="w-full px-3 py-2 border border-gray-200 rounded-lg"
                                placeholder="Liters added"
                            />
                        </div>
                    ))}
                    <div className="flex gap-3 pt-4">
                        <button
                            onClick={() => setShowRefillModal(false)}
                            className="flex-1 px-4 py-2 border border-gray-200 rounded-lg hover:bg-gray-50"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={() => setShowRefillModal(false)}
                            className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                        >
                            Save Refill
                        </button>
                    </div>
                </div>
            </Modal>

            {/* New Trip Modal with Per-Compartment Allocation */}
            <Modal
                isOpen={showTripModal}
                onClose={() => setShowTripModal(false)}
                title="Create New Trip"
                size="lg"
            >
                <div className="space-y-4">
                    {/* Crew Selection */}
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Driver</label>
                            <select className="w-full px-3 py-2 border border-gray-200 rounded-lg">
                                <option value="">Select driver...</option>
                                <option>Juan Cruz</option>
                                <option>Pedro Santos</option>
                                <option>Maria Garcia</option>
                                <option>Jose Reyes</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Porter</label>
                            <select className="w-full px-3 py-2 border border-gray-200 rounded-lg">
                                <option value="">Select porter...</option>
                                <option>Carlos Lopez</option>
                                <option>Ana Mendez</option>
                                <option>Luis Torres</option>
                                <option>Rosa Fernandez</option>
                            </select>
                        </div>
                    </div>

                    {/* Customer & Station */}
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Customer</label>
                            <select className="w-full px-3 py-2 border border-gray-200 rounded-lg">
                                <option value="">Select customer...</option>
                                <option>Shell Philippines</option>
                                <option>Petron Corporation</option>
                                <option>Caltex Philippines</option>
                                <option>Phoenix Petroleum</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Site/Station</label>
                            <select className="w-full px-3 py-2 border border-gray-200 rounded-lg">
                                <option value="">Select site...</option>
                                <option>Shell EDSA</option>
                                <option>Shell Ortigas</option>
                                <option>Petron Makati</option>
                                <option>Caltex BGC</option>
                            </select>
                        </div>
                    </div>

                    {/* Compartment Allocation */}
                    <div className="border-t border-gray-100 pt-4">
                        <label className="block text-sm font-medium text-gray-900 mb-3">
                            Allocate from Compartments
                        </label>
                        <div className="space-y-3">
                            {TANKER_COMPARTMENTS.map((comp) => (
                                <div key={comp.id} className="flex items-center gap-4 p-3 bg-gray-50 rounded-lg">
                                    <div className="flex items-center gap-2 min-w-24">
                                        <div className={`w-3 h-3 rounded-full ${comp.product === 'DIESEL' ? 'bg-blue-500' : 'bg-green-500'}`} />
                                        <span className="font-medium text-gray-700">{comp.name}</span>
                                    </div>
                                    <div className="text-xs text-gray-500 min-w-20">
                                        {comp.product}
                                    </div>
                                    <div className="flex-1">
                                        <input
                                            type="number"
                                            min="0"
                                            max={comp.maxVolume}
                                            value={tripCompartments[comp.id] || 0}
                                            onChange={(e) => setTripCompartments({
                                                ...tripCompartments,
                                                [comp.id]: parseInt(e.target.value) || 0
                                            })}
                                            className="w-full px-3 py-2 border border-gray-200 rounded-lg text-right"
                                            placeholder="0"
                                        />
                                    </div>
                                    <span className="text-sm text-gray-400 w-8">L</span>
                                </div>
                            ))}
                        </div>
                        {/* Total */}
                        <div className="flex justify-between items-center mt-4 p-3 bg-blue-50 rounded-lg">
                            <span className="font-semibold text-blue-900">Total Planned Quantity</span>
                            <span className="text-xl font-bold text-blue-600">{getTotalTripQty().toLocaleString()} L</span>
                        </div>
                    </div>

                    <div className="flex gap-3 pt-4">
                        <button
                            onClick={() => {
                                setShowTripModal(false)
                                setTripCompartments(Object.fromEntries(TANKER_COMPARTMENTS.map(c => [c.id, 0])))
                            }}
                            className="flex-1 px-4 py-2 border border-gray-200 rounded-lg hover:bg-gray-50"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={() => {
                                setShowTripModal(false)
                                setTripCompartments(Object.fromEntries(TANKER_COMPARTMENTS.map(c => [c.id, 0])))
                            }}
                            disabled={getTotalTripQty() === 0}
                            className="flex-1 px-4 py-2 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            <Plus className="h-4 w-4 inline mr-2" />
                            Create Trip ({getTotalTripQty().toLocaleString()}L)
                        </button>
                    </div>
                </div>
            </Modal>
        </div>
    )
}
