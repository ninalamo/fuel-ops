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
    ChevronUp,
    Upload,
    X,
    Play,
    RotateCcw,
    Ban,
    Package,
    Eye
} from 'lucide-react'
import { Modal } from '@/components/Modal'
import { TankerDayDetail, TripDetail, Compartment, TimelineEvent } from '@/lib/types'

const CUSTOMERS = ['Shell Philippines', 'Petron Corporation', 'Caltex Philippines', 'Phoenix Petroleum']
const STATIONS = ['Shell EDSA', 'Shell Ortigas', 'Petron Makati', 'Caltex BGC', 'Phoenix Alabang']
const DRIVERS = ['Juan Cruz', 'Pedro Santos', 'Maria Garcia', 'Jose Reyes']
const PORTERS = ['Carlos Lopez', 'Ana Mendez', 'Luis Torres', 'Rosa Fernandez']
const PRODUCTS = ['DIESEL', 'GASOLINE', 'UNLEADED', 'PREMIUM', 'KEROSENE']

// Local interfaces replaced by imports from '@/lib/types'

export default function TankerDayDetailPage() {
    const params = useParams()
    const [data, setData] = useState<TankerDayDetail | null>(null)
    const [loading, setLoading] = useState(true)
    const [userRole, setUserRole] = useState<string | null>(null)
    const [expandedTrip, setExpandedTrip] = useState<string | null>(null)

    // Modal states
    const [showTripModal, setShowTripModal] = useState(false)
    const [showPodModal, setShowPodModal] = useState(false)
    const [showCancelModal, setShowCancelModal] = useState(false)
    const [showDeliveryModal, setShowDeliveryModal] = useState(false)
    const [selectedTrip, setSelectedTrip] = useState<TripDetail | null>(null)

    // Trip form state - per-compartment allocation and refill
    const [tripForm, setTripForm] = useState({
        driver: '',
        porter: '',
        customer: '',
        station: '',
        compartments: {} as Record<string, { startQty: number; refillQty: number; plannedQty: number; product: string }>,
    })

    // Delivery form state
    const [deliveryForm, setDeliveryForm] = useState<Record<string, number>>({})
    const [deliveryPodFiles, setDeliveryPodFiles] = useState<File[]>([])
    const [showNoPodWarning, setShowNoPodWarning] = useState(false)

    // Cancel reason
    const [cancelReason, setCancelReason] = useState('')

    useEffect(() => {
        const role = localStorage.getItem('userRole')
        setUserRole(role)
        fetchData()
    }, [params.id])

    const fetchData = async () => {
        setLoading(true)
        try {
            const res = await fetch(`/api/tanker-days/${params.id}`)
            if (!res.ok) {
                console.error('Failed to fetch:', res.status, res.statusText)
                setData(null)
                return
            }
            const result = await res.json()
            setData(result)
        } catch (error) {
            console.error('Error fetching tanker day:', error)
            setData(null)
        } finally {
            setLoading(false)
        }
    }

    const canPerformOperations = (userRole === 'encoder' || userRole === 'admin') && data?.status === 'OPEN'
    const canApprove = (userRole === 'supervisor' || userRole === 'admin') && data?.status === 'SUBMITTED'

    const getTotalTripQty = () => Object.values(tripForm.compartments).reduce((a, b) => a + b.plannedQty, 0)

    const handleOpenNewTrip = () => {
        if (!data) return

        const compartmentStates: Record<string, { startQty: number; refillQty: number; plannedQty: number; product: string }> = {}

        data.compartments.forEach(comp => {
            // Find last allocations for this compartment to calculate current balance
            // Iterate trips in reverse to find last usage
            let currentLevel = 0
            let lastProduct = comp.product // Default to tanker config

            if (data.trips.length > 0) {
                // Simple logic: Assuming sequential consistency
                // Look for the last trip segment.
                const lastAlloc = [...data.trips].reverse()
                    .map(t => t.compartmentAllocation?.find(ca => ca.compartmentId === comp.id))
                    .find(Boolean)

                if (lastAlloc) {
                    // If we have history, calc balance
                    const outbound = lastAlloc.actualQty !== null ? lastAlloc.actualQty : lastAlloc.plannedQty
                    const start = lastAlloc.startQty ?? 0
                    const refill = lastAlloc.refillQty ?? 0
                    currentLevel = start + refill - outbound
                    if (lastAlloc.product) lastProduct = lastAlloc.product
                } else {
                    // First trip or never used? Default to 0, user can "Refill" (Initial Load)
                    currentLevel = 0
                }
            }
            // Ensure non-negative
            currentLevel = Math.max(0, currentLevel)

            compartmentStates[comp.id] = {
                startQty: currentLevel,
                refillQty: 0,
                plannedQty: 0,
                product: lastProduct
            }
        })

        setTripForm({
            driver: '',
            porter: '',
            customer: '',
            station: '',
            compartments: compartmentStates
        })
        setShowTripModal(true)
    }

    // Trip Actions
    const handleCreateTrip = () => {
        if (!data) return
        const newTrip: TripDetail = {
            tripId: `trip-${Date.now()}`,
            id: `trip-${Date.now()}`,
            tripNumber: (data.trips.length + 1).toString(),
            tankerId: data.tankerId,
            driver: tripForm.driver || data.driver,
            porter: tripForm.porter || data.porter,
            eta: '00:00',
            customer: tripForm.customer,
            station: tripForm.station,
            products: Array.from(new Set(
                Object.keys(tripForm.compartments)
                    .filter(id => tripForm.compartments[id].plannedQty > 0)
                    .map(id => tripForm.compartments[id].product || data.compartments.find((c: Compartment) => c.id === id)?.product)
                    .filter((p): p is string => !!p)
            )),
            status: 'PENDING',
            departedAt: null,
            returnedAt: null,
            plannedQty: getTotalTripQty(),
            actualQty: null,
            variance: null,
            hasPod: false,
            podFiles: [],
            // Snapshot all compartments
            compartmentAllocation: data.compartments.map((c: Compartment) => {
                const formState = tripForm.compartments[c.id]
                return {
                    compartmentId: c.id,
                    name: c.name,
                    startQty: formState.startQty,
                    refillQty: formState.refillQty,
                    totalQty: formState.startQty + formState.refillQty,
                    plannedQty: formState.plannedQty,
                    actualQty: null,
                    product: formState.product // Save the selected product for this trip
                }
            }),
        }
        setData({
            ...data,
            trips: [...data.trips, newTrip],
            summary: {
                ...data.summary,
                totalPlanned: data.summary.totalPlanned + newTrip.plannedQty,
                totalTrips: data.summary.totalTrips + 1,
            },
        })
        setShowTripModal(false)
    }

    const handleDepartTrip = (trip: TripDetail) => {
        if (!data) return
        setData({
            ...data,
            trips: data.trips.map(t =>
                t.id === trip.id
                    ? { ...t, status: 'DEPARTED' as const, departedAt: new Date().toISOString() }
                    : t
            ),
        })
    }

    const handleOpenDelivery = (trip: TripDetail) => {
        setSelectedTrip(trip)
        setDeliveryForm(
            Object.fromEntries(
                trip.compartmentAllocation.map(ca => [ca.compartmentId, ca.plannedQty])
            )
        )
        setShowDeliveryModal(true)
    }

    const handleRecordDelivery = () => {
        if (!data || !selectedTrip) return
        const totalActual = Object.values(deliveryForm).reduce((a, b) => a + b, 0)
        const variance = totalActual - selectedTrip.plannedQty

        setData({
            ...data,
            trips: data.trips.map(t =>
                t.id === selectedTrip.id
                    ? {
                        ...t,
                        status: 'RETURNED' as const,
                        returnedAt: new Date().toISOString(),
                        actualQty: totalActual,
                        variance,
                        compartmentAllocation: t.compartmentAllocation.map(ca => ({
                            ...ca,
                            actualQty: deliveryForm[ca.compartmentId] || 0,
                        })),
                    }
                    : t
            ),
            summary: {
                ...data.summary,
                totalDelivered: data.summary.totalDelivered + totalActual,
                totalVariance: data.summary.totalVariance + variance,
                tripsCompleted: data.summary.tripsCompleted + 1,
            },
        })
        setShowDeliveryModal(false)
        setSelectedTrip(null)
    }

    const handleOpenCancel = (trip: TripDetail) => {
        setSelectedTrip(trip)
        setCancelReason('')
        setShowCancelModal(true)
    }

    const handleCancelTrip = () => {
        if (!data || !selectedTrip) return
        setData({
            ...data,
            trips: data.trips.map(t =>
                t.id === selectedTrip.id
                    ? { ...t, status: 'CANCELLED' as const, cancelReason }
                    : t
            ),
        })
        setShowCancelModal(false)
        setSelectedTrip(null)
    }

    const handleOpenPod = (trip: TripDetail) => {
        setSelectedTrip(trip)
        setShowPodModal(true)
    }

    const addToTimeline = async (title: string, description: string, type: 'SNAPSHOT' | 'REFILL' | 'TRIP' = 'SNAPSHOT', status: 'COMPLETED' | 'IN_PROGRESS' | 'PENDING' = 'COMPLETED') => {
        if (!data) return

        const newEvent = {
            id: `evt-${Date.now()}`,
            type,
            title,
            description,
            timestamp: new Date().toISOString(),
            status
        }

        // Optimistically update local state first
        const updatedTimeline = [...data.timeline, newEvent]
        setData(prev => prev ? { ...prev, timeline: updatedTimeline } : null)

        try {
            // Persist to API (PATCH the whole timeline array)
            // Note: Concurrency issue if multiple users edit timeline, but acceptable for now
            await fetch(`http://localhost:3001/tankerDays/${data.id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    timeline: updatedTimeline
                })
            })
        } catch (error) {
            console.error('Failed to persist timeline:', error)
            // Revert on failure? skipping for simplicity
        }
    }

    const handleUploadPod = async () => {
        if (!data || !selectedTrip) return

        const timestamp = new Date().toISOString()
        const filename = `POD_${selectedTrip.tripNumber}_${Date.now()}.jpg`
        const newPodFiles = [...selectedTrip.podFiles, filename]

        try {
            // 1. Create pseudo-POD via API for Trips page compatibility
            await fetch('http://localhost:3001/pods', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    id: `pod-${Date.now()}`,
                    tripId: selectedTrip.id,
                    files: [{
                        name: filename,
                        size: 1024,
                        uploadedAt: timestamp
                    }],
                    status: 'PENDING_REVIEW',
                    uploadedBy: 'Encoder',
                    uploadedAt: timestamp
                })
            })

            // 2. Update Trip via API
            await fetch(`http://localhost:3001/trips/${selectedTrip.id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    hasPod: true,
                    status: 'COMPLETED',
                    completedAt: timestamp,
                    podFiles: newPodFiles
                })
            })

            // 3. Add Timeline Event
            await addToTimeline(
                'POD Uploaded',
                `POD uploaded for Trip #${selectedTrip.tripNumber}`,
                'TRIP' // Using TRIP type for pod upload
            )

        } catch (error) {
            console.error('Failed to sync POD upload:', error)
            // Continue to optimistic update
        }

        setData((prev) => {
            if (!prev) return null
            return {
                ...prev,
                trips: prev.trips.map(t =>
                    t.id === selectedTrip.id
                        ? {
                            ...t,
                            hasPod: true,
                            podFiles: newPodFiles,
                            status: 'COMPLETED',
                            completedAt: timestamp
                        }
                        : t
                ),
            }
        })
        setShowPodModal(false)
        setSelectedTrip(null)
    }

    const handleSubmitForReview = async () => {
        if (!data) return

        try {
            // Update via API
            await fetch(`http://localhost:3001/tankerDays/${data.id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    status: 'SUBMITTED'
                })
            })

            // Update local state
            setData({ ...data, status: 'SUBMITTED' })

            // Add timeline event
            await addToTimeline('Submitted for Review', 'Tanker Day submitted for approval', 'SNAPSHOT')
        } catch (error) {
            console.error('Failed to submit:', error)
        }
    }

    const handleReturn = async () => {
        if (!data) return
        try {
            await fetch(`http://localhost:3001/tankerDays/${data.id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status: 'OPEN' })
            })
            setData({ ...data, status: 'OPEN' })
            await addToTimeline('Returned', 'Tanker Day returned for correction', 'SNAPSHOT')
        } catch (error) {
            console.error('Failed to return:', error)
        }
    }

    const handleApprove = async () => {
        if (!data) return
        try {
            await fetch(`http://localhost:3001/tankerDays/${data.id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status: 'LOCKED' })
            })
            setData({ ...data, status: 'LOCKED' })
            await addToTimeline('Approved & Locked', 'Tanker Day operations approved and locked', 'SNAPSHOT')
        } catch (error) {
            console.error('Failed to approve:', error)
        }
    }

    const getStatusBadge = (status: string) => {
        const styles: Record<string, string> = {
            OPEN: 'bg-blue-100 text-blue-700',
            SUBMITTED: 'bg-yellow-100 text-yellow-700',
            LOCKED: 'bg-green-50 text-green-600',
            PENDING: 'bg-gray-100 text-gray-700',
            DEPARTED: 'bg-blue-100 text-blue-700',
            RETURNED: 'bg-green-100 text-green-700',
            CANCELLED: 'bg-red-100 text-red-700',
        }
        const icons: Record<string, typeof Clock> = {
            PENDING: Clock,
            DEPARTED: Play,
            RETURNED: CheckCircle,
            CANCELLED: Ban,
        }
        const Icon = icons[status]
        return (
            <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium ${styles[status] || styles.PENDING}`}>
                {Icon && <Icon className="h-3 w-3" />}
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
            {/* Breadcrumb */}
            <nav className="flex items-center gap-2 text-sm text-gray-600 mb-6">
                <Link href="/fleet-status" className="hover:text-gray-900">
                    Tanker Operations
                </Link>
                <span className="text-gray-400">/</span>
                <span className="text-gray-900 font-medium">{data.plateNumber}</span>
            </nav>

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
                        <button
                            onClick={handleSubmitForReview}
                            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium text-sm flex items-center gap-2"
                        >
                            <Send className="h-4 w-4" />
                            Submit for Review
                        </button>
                    )}
                    {data.status === 'SUBMITTED' && canApprove && (
                        <>
                            <button
                                onClick={handleReturn}
                                className="px-4 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 font-medium text-sm"
                            >
                                Return
                            </button>
                            <button
                                onClick={handleApprove}
                                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium text-sm flex items-center gap-2"
                            >
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
                    {/* Operations Actions */}
                    {canPerformOperations && data.status === 'OPEN' && (
                        <div className="bg-white rounded-xl border border-gray-100 p-6">
                            <h3 className="font-semibold text-gray-900 mb-4">Operations</h3>
                            <div className="grid grid-cols-1 gap-4">
                                <button
                                    onClick={() => handleOpenNewTrip()}
                                    className="flex items-center justify-center gap-3 p-4 rounded-xl bg-blue-600 text-white hover:bg-blue-700 transition-colors shadow-sm"
                                >
                                    <MapPin className="h-6 w-6" />
                                    <span className="font-semibold text-lg">New Trip</span>
                                </button>
                                <p className="text-center text-sm text-gray-500">
                                    Creating a trip will automatically record snapshots and allow for refills.
                                </p>
                            </div>
                        </div>
                    )}

                    {/* Trips List */}
                    <div className="bg-white rounded-xl border border-gray-100 p-6">
                        <h3 className="font-semibold text-gray-900 mb-4">Trips ({data.trips.length})</h3>
                        <div className="space-y-3">
                            {data.trips.map((trip) => (
                                <div key={trip.id} className={`border rounded-lg overflow-hidden ${trip.status === 'CANCELLED' ? 'border-red-200 bg-red-50/30' : 'border-gray-100'}`}>
                                    {/* Trip Header */}
                                    <button
                                        onClick={() => setExpandedTrip(expandedTrip === trip.id ? null : trip.id)}
                                        className="w-full flex items-center justify-between p-4 hover:bg-gray-50 transition-colors"
                                    >
                                        <div className="flex items-center gap-4">
                                            <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${trip.status === 'CANCELLED' ? 'bg-red-100 text-red-700' : 'bg-yellow-100 text-yellow-700'}`}>
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
                                                        <div className="text-sm text-gray-500">Planned: {trip.plannedQty.toLocaleString()}L</div>
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
                                            {trip.status === 'CANCELLED' && trip.cancelReason && (
                                                <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-lg text-sm">
                                                    <strong>Cancelled:</strong> {trip.cancelReason}
                                                </div>
                                            )}
                                            <div className="grid grid-cols-2 gap-4 text-sm mb-4">
                                                <div><span className="text-gray-500">Driver:</span> {trip.driver}</div>
                                                <div><span className="text-gray-500">Porter:</span> {trip.porter}</div>
                                                <div><span className="text-gray-500">Product:</span> {trip.products.join(', ')}</div>
                                                <div><span className="text-gray-500">POD:</span> {trip.hasPod ? `✓ ${trip.podFiles.length} file(s)` : 'Missing'}</div>
                                            </div>

                                            {/* Compartment Allocation */}
                                            {trip.compartmentAllocation && trip.compartmentAllocation.length > 0 && (
                                                <div className="mt-4">
                                                    <h4 className="text-xs font-semibold text-gray-500 uppercase mb-2">Compartment Allocation</h4>
                                                    <div className="space-y-2">
                                                        {trip.compartmentAllocation.map(ca => (
                                                            <div key={ca.compartmentId} className="flex justify-between items-center p-2 bg-white rounded border border-gray-100">
                                                                <div>
                                                                    <div className="font-medium text-gray-700">{ca.name}</div>
                                                                    {(ca.startQty !== undefined || ca.refillQty !== undefined) && (
                                                                        <div className="text-xs text-gray-400 flex items-center gap-1">
                                                                            <span>Start: {ca.startQty?.toLocaleString() ?? 0}L</span>
                                                                            {ca.refillQty ? <span className="text-green-600 font-medium">(+{ca.refillQty.toLocaleString()}L Refill)</span> : ''}
                                                                            <span className="text-gray-300">|</span>
                                                                            <span>Avail: {((ca.startQty || 0) + (ca.refillQty || 0)).toLocaleString()}L</span>
                                                                        </div>
                                                                    )}
                                                                </div>
                                                                <div className="text-right">
                                                                    <div className="text-sm text-gray-900">
                                                                        {ca.actualQty !== null ? `${ca.actualQty.toLocaleString()}L` : `${ca.plannedQty.toLocaleString()}L`}
                                                                    </div>
                                                                    {ca.actualQty !== null && ca.actualQty !== ca.plannedQty && (
                                                                        <div className="text-xs text-gray-500">(planned: {ca.plannedQty.toLocaleString()}L)</div>
                                                                    )}
                                                                </div>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}

                                            {/* Trip Actions */}
                                            {canPerformOperations && data.status === 'OPEN' && trip.status !== 'CANCELLED' && (
                                                <div className="mt-4 pt-4 border-t border-gray-200 flex flex-wrap gap-2">
                                                    {trip.status === 'PENDING' && (
                                                        <>
                                                            <button
                                                                onClick={() => handleDepartTrip(trip)}
                                                                className="px-3 py-1.5 bg-blue-600 text-white rounded-lg text-sm font-medium flex items-center gap-1 hover:bg-blue-700"
                                                            >
                                                                <Play className="h-3 w-3" /> Depart
                                                            </button>
                                                            <button
                                                                onClick={() => handleOpenCancel(trip)}
                                                                className="px-3 py-1.5 bg-red-100 text-red-700 rounded-lg text-sm font-medium flex items-center gap-1 hover:bg-red-200"
                                                            >
                                                                <Ban className="h-3 w-3" /> Cancel
                                                            </button>
                                                        </>
                                                    )}
                                                    {trip.status === 'DEPARTED' && (
                                                        <>
                                                            <button
                                                                onClick={() => handleOpenDelivery(trip)}
                                                                className="px-3 py-1.5 bg-green-600 text-white rounded-lg text-sm font-medium flex items-center gap-1 hover:bg-green-700"
                                                            >
                                                                <Package className="h-3 w-3" /> Record Delivery
                                                            </button>
                                                            <button
                                                                onClick={() => handleOpenCancel(trip)}
                                                                className="px-3 py-1.5 bg-red-100 text-red-700 rounded-lg text-sm font-medium flex items-center gap-1 hover:bg-red-200"
                                                            >
                                                                <Ban className="h-3 w-3" /> Cancel
                                                            </button>
                                                        </>
                                                    )}
                                                    {trip.status === 'RETURNED' && !trip.hasPod && (
                                                        <button
                                                            onClick={() => handleOpenPod(trip)}
                                                            className="px-3 py-1.5 bg-purple-600 text-white rounded-lg text-sm font-medium flex items-center gap-1 hover:bg-purple-700"
                                                        >
                                                            <Upload className="h-3 w-3" /> Upload POD
                                                        </button>
                                                    )}
                                                    {trip.status === 'RETURNED' && trip.hasPod && (
                                                        <button
                                                            onClick={() => handleOpenPod(trip)}
                                                            className="px-3 py-1.5 bg-gray-100 text-gray-700 rounded-lg text-sm font-medium flex items-center gap-1 hover:bg-gray-200"
                                                        >
                                                            <FileText className="h-3 w-3" /> View/Add POD
                                                        </button>
                                                    )}
                                                    {(trip.status === 'RETURNED' || trip.status === 'COMPLETED') && (
                                                        <Link
                                                            href={`/trips/${trip.id}`}
                                                            className="px-3 py-1.5 bg-blue-50 text-blue-700 rounded-lg text-sm font-medium flex items-center gap-1 hover:bg-blue-100"
                                                        >
                                                            <Eye className="h-3 w-3" /> View Trip Details
                                                        </Link>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>
                            ))}
                            {data.trips.length === 0 && (
                                <div className="text-center py-8 text-gray-500">
                                    <MapPin className="h-12 w-12 mx-auto text-gray-300 mb-2" />
                                    <p>No trips created yet. Click "New Trip" to add one.</p>
                                </div>
                            )}
                        </div>
                    </div>


                </div>

                {/* Right Column - Summary */}
                <div className="space-y-6">
                    {/* Summary */}
                    <div className="bg-white rounded-xl border border-gray-100 p-6">
                        <h3 className="font-semibold text-gray-900 mb-4">Summary</h3>
                        <div className="space-y-4">
                            <div className="flex justify-between items-center">
                                <span className="text-gray-500">Total Planned (Day)</span>
                                <span className="font-bold text-gray-900">{data.summary.totalPlanned.toLocaleString()} L</span>
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="text-gray-500">Delivered (Day)</span>
                                <span className="font-bold text-gray-900">{data.summary.totalDelivered.toLocaleString()} L</span>
                            </div>
                            {data.summary.totalVariance !== 0 && (
                                <div className={`flex justify-between items-center ${data.summary.totalVariance < 0 ? 'text-red-600' : 'text-green-600'}`}>
                                    <span>Variance</span>
                                    <span className="font-bold">{data.summary.totalVariance > 0 ? '+' : ''}{data.summary.totalVariance.toLocaleString()} L</span>
                                </div>
                            )}
                            <div className="border-t border-gray-100 pt-4 flex justify-between items-center">
                                <span className="text-gray-500">Trips</span>
                                <span className="font-bold text-gray-900">{data.summary.tripsCompleted}/{data.summary.totalTrips}</span>
                            </div>
                            {data.summary.exceptions > 0 && (
                                <div className="flex justify-between items-center text-red-600">
                                    <span className="flex items-center gap-1"><AlertTriangle className="h-4 w-4" />Exceptions</span>
                                    <span className="font-bold">{data.summary.exceptions}</span>
                                </div>
                            )}
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
            </div>



            {/* New Trip Modal */}
            <Modal isOpen={showTripModal} onClose={() => setShowTripModal(false)} title="Create New Trip" size="lg">
                <div className="space-y-4">
                    {/* Crew Selection */}
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Driver</label>
                            <select value={tripForm.driver} onChange={(e) => setTripForm({ ...tripForm, driver: e.target.value })} className="w-full px-3 py-2 border border-gray-200 rounded-lg">
                                <option value="">Use default ({data.driver})</option>
                                {DRIVERS.map(d => <option key={d} value={d}>{d}</option>)}
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Porter</label>
                            <select value={tripForm.porter} onChange={(e) => setTripForm({ ...tripForm, porter: e.target.value })} className="w-full px-3 py-2 border border-gray-200 rounded-lg">
                                <option value="">Use default ({data.porter})</option>
                                {PORTERS.map(p => <option key={p} value={p}>{p}</option>)}
                            </select>
                        </div>
                    </div>
                    {/* Customer & Station */}
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Customer</label>
                            <select value={tripForm.customer} onChange={(e) => setTripForm({ ...tripForm, customer: e.target.value })} className="w-full px-3 py-2 border border-gray-200 rounded-lg">
                                <option value="">Select customer...</option>
                                {CUSTOMERS.map(c => <option key={c} value={c}>{c}</option>)}
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Station</label>
                            <select value={tripForm.station} onChange={(e) => setTripForm({ ...tripForm, station: e.target.value })} className="w-full px-3 py-2 border border-gray-200 rounded-lg">
                                <option value="">Select station...</option>
                                {STATIONS.map(s => <option key={s} value={s}>{s}</option>)}
                            </select>
                        </div>
                    </div>
                    {/* Compartment Allocation, Refill & Planning */}
                    <div className="border-t border-gray-100 pt-4">
                        <label className="block text-sm font-medium text-gray-900 mb-3">Snapshot & Plan</label>
                        <div className="space-y-4">
                            {data.compartments.map((comp: Compartment) => {
                                const state = tripForm.compartments[comp.id] || { startQty: 0, refillQty: 0, plannedQty: 0 }
                                const totalAvailable = state.startQty + state.refillQty
                                const isOverAllocated = state.plannedQty > totalAvailable

                                return (
                                    <div key={comp.id} className="p-3 bg-gray-50 rounded-lg border border-gray-100">
                                        {/* Header */}
                                        <div className="flex justify-between items-center mb-2">
                                            <div className="flex items-center gap-2">
                                                <div className={`w-3 h-3 rounded-full ${comp.product === 'DIESEL' ? 'bg-blue-500' : 'bg-green-500'}`} />
                                                <span className="font-medium text-gray-900">{comp.name}</span>
                                                {/* Product Selector */}
                                                <select
                                                    value={state.product || comp.product} // fallback to comp.product if undefined
                                                    onChange={(e) => {
                                                        const newProduct = e.target.value
                                                        setTripForm(prev => ({
                                                            ...prev,
                                                            compartments: {
                                                                ...prev.compartments,
                                                                [comp.id]: {
                                                                    ...state,
                                                                    product: newProduct
                                                                }
                                                            }
                                                        }))
                                                    }}
                                                    className="text-xs border-0 bg-transparent py-0 pl-1 pr-6 text-gray-500 focus:ring-0 cursor-pointer font-medium hover:text-blue-600"
                                                >
                                                    {PRODUCTS.map(p => (
                                                        <option key={p} value={p}>{p}</option>
                                                    ))}
                                                </select>
                                            </div>
                                            <div className="text-xs text-gray-400">Max: {comp.maxVolume.toLocaleString()}L</div>
                                        </div>

                                        {/* Inputs Grid */}
                                        <div className="grid grid-cols-2 gap-3">
                                            {/* Current Level */}
                                            <div>
                                                <label className="block text-xs font-medium text-gray-500 mb-1">Current</label>
                                                <input
                                                    type="number"
                                                    value={state.startQty}
                                                    disabled
                                                    className="w-full px-2 py-1.5 bg-gray-100 border border-gray-200 rounded text-right text-gray-500"
                                                />
                                            </div>

                                            {/* Add/Refill */}
                                            <div>
                                                <label className="block text-xs font-medium text-blue-600 mb-1">+ Refill (Planned)</label>
                                                <input
                                                    type="number"
                                                    min="0"
                                                    value={state.refillQty || ''}
                                                    onChange={(e) => {
                                                        const newVal = Math.max(0, parseInt(e.target.value) || 0)
                                                        setTripForm(prev => ({
                                                            ...prev,
                                                            compartments: {
                                                                ...prev.compartments,
                                                                [comp.id]: {
                                                                    ...state,
                                                                    refillQty: newVal,
                                                                    plannedQty: newVal // Auto-sync: Refill = Planned
                                                                }
                                                            }
                                                        }))
                                                    }}
                                                    className="w-full px-2 py-1.5 border border-blue-200 rounded text-right focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                                                    placeholder="0"
                                                />
                                            </div>
                                        </div>

                                        {/* Total Available Indicator */}
                                        <div className="flex justify-between items-center mt-2 text-xs">
                                            <span className="text-gray-500">Total Available:</span>
                                            <span className={`font-medium ${isOverAllocated ? 'text-red-600' : 'text-gray-700'}`}>
                                                {totalAvailable.toLocaleString()} L
                                            </span>
                                        </div>
                                    </div>
                                )
                            })}
                        </div>
                        <div className="mt-4 p-3 bg-blue-50 rounded-lg flex justify-between items-center border border-blue-100">
                            <span className="font-semibold text-blue-900">Total Planned Quantity</span>
                            <span className="text-xl font-bold text-blue-600">{getTotalTripQty().toLocaleString()} L</span>
                        </div>
                    </div>
                    <div className="flex gap-3 pt-4">
                        <button onClick={() => setShowTripModal(false)} className="flex-1 px-4 py-2 border border-gray-200 rounded-lg hover:bg-gray-50">Cancel</button>
                        <button onClick={handleCreateTrip} disabled={getTotalTripQty() === 0 || !tripForm.customer || !tripForm.station} className="flex-1 px-4 py-2 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600 disabled:opacity-50 disabled:cursor-not-allowed">
                            <Plus className="h-4 w-4 inline mr-2" />Create Trip ({getTotalTripQty().toLocaleString()}L)
                        </button>
                    </div>
                </div>
            </Modal>

            {/* Record Delivery Modal */}
            <Modal isOpen={showDeliveryModal} onClose={() => setShowDeliveryModal(false)} title="Record Delivery & Return" size="lg">
                <div className="space-y-4">
                    {selectedTrip && (
                        <>
                            <div className="p-4 bg-gray-50 rounded-lg">
                                <div className="font-medium text-gray-900">Trip #{selectedTrip.tripNumber} - {selectedTrip.station}</div>
                                <div className="text-sm text-gray-500">{selectedTrip.customer} • Planned: {selectedTrip.plannedQty.toLocaleString()}L</div>
                            </div>
                            <p className="text-sm text-gray-600">Enter the actual quantity delivered from each compartment:</p>
                            {selectedTrip.compartmentAllocation.map(ca => (
                                <div key={ca.compartmentId} className="flex items-center gap-4 p-3 bg-gray-50 rounded-lg">
                                    <div className="flex items-center gap-2 min-w-24">
                                        <span className="font-medium text-gray-700">{ca.name}</span>
                                    </div>
                                    <div className="text-xs text-gray-500 min-w-20">Planned: {ca.plannedQty.toLocaleString()}L</div>
                                    <div className="flex-1">
                                        <input
                                            type="number"
                                            min="0"
                                            value={deliveryForm[ca.compartmentId] || 0}
                                            onChange={(e) => setDeliveryForm({
                                                ...deliveryForm,
                                                [ca.compartmentId]: parseInt(e.target.value) || 0
                                            })}
                                            className="w-full px-3 py-2 border border-gray-200 rounded-lg text-right"
                                        />
                                    </div>
                                    <span className="text-sm text-gray-400 w-8">L</span>
                                </div>
                            ))}
                            <div className="mt-3 p-3 bg-green-50 rounded-lg flex justify-between items-center">
                                <span className="font-semibold text-green-900">Total Actual Delivered</span>
                                <span className="text-xl font-bold text-green-600">{Object.values(deliveryForm).reduce((a, b) => a + b, 0).toLocaleString()} L</span>
                            </div>
                        </>
                    )}
                    <div className="flex gap-3 pt-4">
                        <button onClick={() => setShowDeliveryModal(false)} className="flex-1 px-4 py-2 border border-gray-200 rounded-lg hover:bg-gray-50">Cancel</button>
                        <button onClick={handleRecordDelivery} className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center justify-center gap-2">
                            <CheckCircle className="h-4 w-4" /> Record Delivery
                        </button>
                    </div>
                </div>
            </Modal>

            {/* Cancel Trip Modal */}
            <Modal isOpen={showCancelModal} onClose={() => setShowCancelModal(false)} title="Cancel Trip" size="sm">
                <div className="space-y-4">
                    {selectedTrip && (
                        <div className="p-4 bg-red-50 rounded-lg text-red-800">
                            <div className="font-medium">Trip #{selectedTrip.tripNumber} - {selectedTrip.station}</div>
                            <div className="text-sm">{selectedTrip.plannedQty.toLocaleString()}L planned</div>
                        </div>
                    )}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Reason for Cancellation</label>
                        <textarea
                            value={cancelReason}
                            onChange={(e) => setCancelReason(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-200 rounded-lg"
                            rows={3}
                            placeholder="e.g. Customer request, equipment issue, etc."
                        />
                    </div>
                    <div className="flex gap-3 pt-4">
                        <button onClick={() => setShowCancelModal(false)} className="flex-1 px-4 py-2 border border-gray-200 rounded-lg hover:bg-gray-50">Keep Trip</button>
                        <button onClick={handleCancelTrip} disabled={!cancelReason} className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 flex items-center justify-center gap-2">
                            <Ban className="h-4 w-4" /> Cancel Trip
                        </button>
                    </div>
                </div>
            </Modal>

            {/* POD Upload Modal */}
            <Modal isOpen={showPodModal} onClose={() => setShowPodModal(false)} title="Proof of Delivery" size="lg">
                <div className="space-y-4">
                    {selectedTrip && (
                        <>
                            <div className="p-4 bg-purple-50 rounded-lg">
                                <div className="font-medium text-purple-900">Trip #{selectedTrip.tripNumber} - {selectedTrip.station}</div>
                                <div className="text-sm text-purple-700">{selectedTrip.customer} • Delivered: {selectedTrip.actualQty?.toLocaleString() || 0}L</div>
                            </div>

                            {/* Existing PODs */}
                            {selectedTrip.podFiles.length > 0 && (
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Uploaded Documents</label>
                                    <div className="space-y-2">
                                        {selectedTrip.podFiles.map((file, idx) => (
                                            <div key={idx} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                                                <div className="flex items-center gap-2">
                                                    <FileText className="h-5 w-5 text-green-500" />
                                                    <span className="text-sm text-gray-700">{file}</span>
                                                </div>
                                                <button className="text-xs text-blue-600 hover:text-blue-800">View</button>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Upload New */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Upload New Document</label>
                                <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-purple-400 transition-colors cursor-pointer">
                                    <Upload className="h-10 w-10 mx-auto text-gray-400 mb-3" />
                                    <p className="text-sm text-gray-500">Drag and drop files here, or click to browse</p>
                                    <p className="text-xs text-gray-400 mt-1">Supports: JPG, PNG, PDF (max 10MB)</p>
                                </div>
                            </div>
                        </>
                    )}
                    <div className="flex gap-3 pt-4">
                        <button onClick={() => setShowPodModal(false)} className="flex-1 px-4 py-2 border border-gray-200 rounded-lg hover:bg-gray-50">Close</button>
                        <button onClick={handleUploadPod} className="flex-1 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 flex items-center justify-center gap-2">
                            <Upload className="h-4 w-4" /> Upload POD
                        </button>
                    </div>
                </div>
            </Modal>
        </div>
    )
}
