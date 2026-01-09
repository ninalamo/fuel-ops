'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { format } from 'date-fns'
import {
    Plus,
    Truck,
    Calendar,
    ChevronRight,
    Lock,
    Send,
    Circle,
    Eye,
    CheckCircle,
    User,
    Fuel,
    X,
    Layers
} from 'lucide-react'
import { Modal } from '@/components/Modal'

interface TankerDay {
    id: string
    date: string
    tankerId: string
    plateNumber: string
    driver: string
    status: 'OPEN' | 'SUBMITTED' | 'RETURNED' | 'LOCKED'
    tripsCompleted: number
    totalTrips: number
    litersDelivered: number
    hasExceptions: boolean
}

interface DashboardStats {
    fleetTotal: number
    tankerDaysOpen: number
    submitted: number
    locked: number
}

interface Tanker {
    id: string
    plateNumber: string
    capacity: number
    compartments: number
}

export default function DashboardPage() {
    const [tankerDays, setTankerDays] = useState<TankerDay[]>([])
    const [allTankers, setAllTankers] = useState<Tanker[]>([])
    const [stats, setStats] = useState<DashboardStats>({ fleetTotal: 0, tankerDaysOpen: 0, submitted: 0, locked: 0 })
    const [loading, setLoading] = useState(true)
    const [businessDate, setBusinessDate] = useState(format(new Date(), 'yyyy-MM-dd'))
    const [userRole, setUserRole] = useState<string | null>(null)

    // Create Tanker Day Modal
    const [showCreateModal, setShowCreateModal] = useState(false)
    const [createForm, setCreateForm] = useState({
        tankerId: '',
    })

    // Filter state
    const [filterStatus, setFilterStatus] = useState<string>('ALL')
    const [filterTanker, setFilterTanker] = useState('')

    useEffect(() => {
        const role = localStorage.getItem('userRole')
        setUserRole(role)
        // Default to SUBMITTED filter for supervisor
        if (role === 'supervisor') {
            setFilterStatus('SUBMITTED')
        }
        fetchData()
    }, [businessDate])

    const fetchData = async () => {
        setLoading(true)
        try {
            // Fetch tanker days for the date
            const res = await fetch(`/api/tanker-days?date=${businessDate}`)
            const data = await res.json()
            setTankerDays(data.tankerDays)

            // Fetch all tankers from master data
            const tankersRes = await fetch('http://localhost:3001/tankers')
            const tankers = await tankersRes.json()
            setAllTankers(tankers)

            // Calculate stats
            const openCount = data.tankerDays.filter((td: TankerDay) => td.status === 'OPEN').length
            const submittedCount = data.tankerDays.filter((td: TankerDay) => td.status === 'SUBMITTED').length
            const lockedCount = data.tankerDays.filter((td: TankerDay) => td.status === 'LOCKED').length

            setStats({
                fleetTotal: tankers.length,
                tankerDaysOpen: openCount,
                submitted: submittedCount,
                locked: lockedCount
            })
        } catch (error) {
            console.error('Error fetching data:', error)
        } finally {
            setLoading(false)
        }
    }

    const handleCreateTankerDay = async () => {
        try {
            const res = await fetch('/api/tanker-days', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    date: businessDate,
                    tankerId: createForm.tankerId
                })
            })

            if (!res.ok) {
                const err = await res.json()
                alert(err.error || 'Failed to create tanker day')
                return
            }

            const newTankerDay = await res.json()
            setTankerDays([...tankerDays, newTankerDay])
            setStats({ ...stats, tankerDaysOpen: stats.tankerDaysOpen + 1 })
            setShowCreateModal(false)
            setCreateForm({ tankerId: '' })
        } catch (error) {
            console.error('Failed to create tanker day:', error)
            alert('An error occurred while creating the tanker day')
        }
    }

    const handleBulkCreate = async () => {
        const assignedIds = tankerDays.map(td => td.tankerId)
        const toCreate = allTankers.filter((t: Tanker) => !assignedIds.includes(t.id))

        if (toCreate.length === 0) return

        // Create tanker days via API for each available tanker
        for (const tanker of toCreate) {
            try {
                await fetch('/api/tanker-days', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        date: businessDate,
                        tankerId: tanker.id
                    })
                })
            } catch (error) {
                console.error(`Failed to create tanker day for ${tanker.plateNumber}:`, error)
            }
        }

        // Refresh data
        fetchData()
    }

    const getStatusBadge = (status: string) => {
        const styles: Record<string, string> = {
            OPEN: 'bg-blue-100 text-blue-700 border-blue-200',
            SUBMITTED: 'bg-yellow-100 text-yellow-700 border-yellow-200',
            RETURNED: 'bg-orange-100 text-orange-700 border-orange-200',
            LOCKED: 'bg-emerald-50 text-emerald-600 border-emerald-200',
        }

        const icons: Record<string, typeof Circle> = {
            OPEN: Circle,
            SUBMITTED: Send,
            RETURNED: Circle,
            LOCKED: Lock,
        }

        const Icon = icons[status] || Circle

        return (
            <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium border ${styles[status] || styles.OPEN}`}>
                <Icon className="h-3 w-3" />
                {status}
            </span>
        )
    }

    // Filter tanker days based on role and user filters
    const filteredTankerDays = tankerDays.filter(td => {
        // Role-based filtering for supervisor
        if (userRole === 'supervisor') {
            if (td.status !== 'SUBMITTED' && td.status !== 'LOCKED') {
                return false
            }
        }

        // Status filter
        if (filterStatus !== 'ALL' && td.status !== filterStatus) {
            return false
        }

        // Tanker name filter (case-insensitive search)
        if (filterTanker && !td.plateNumber.toLowerCase().includes(filterTanker.toLowerCase())) {
            return false
        }

        return true
    })

    // Get tankers already assigned today
    const assignedTankerIds = tankerDays.map(td => td.tankerId)
    const availableTankersForDay = allTankers.filter((t: Tanker) => !assignedTankerIds.includes(t.id))
    const isToday = businessDate === format(new Date(), 'yyyy-MM-dd')

    const getRoleTitle = () => {
        switch (userRole) {
            case 'encoder': return 'Fleet Status'
            case 'supervisor': return 'Fleet Review'
            case 'admin': return 'Fleet Status - Admin'
            default: return 'Fleet Status'
        }
    }

    const getRoleSubtitle = () => {
        switch (userRole) {
            case 'encoder': return 'Manage tanker daily operations, trips, and fuel recording'
            case 'supervisor': return 'Review, approve records and POD verification'
            case 'admin': return 'System administration and master data'
            default: return 'Track and manage operations'
        }
    }

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            {/* Page Header */}
            <div className="flex flex-wrap justify-between items-start gap-4 mb-8">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">{getRoleTitle()}</h1>
                    <p className="text-gray-500 mt-1">{getRoleSubtitle()}</p>
                </div>
                <div className="flex items-center gap-3">
                    {/* Business Date Picker */}
                    <div className="flex items-center gap-2 px-3 py-2 bg-white border border-gray-200 rounded-lg">
                        <Calendar className="h-4 w-4 text-gray-500" />
                        <input
                            type="date"
                            value={businessDate}
                            onChange={(e) => setBusinessDate(e.target.value)}
                            className="text-sm font-medium text-gray-700 border-0 bg-transparent focus:outline-none"
                        />
                    </div>
                    {/* Create Tanker Day Button - Only for Encoder/Admin and current day */}
                    {(userRole === 'encoder' || userRole === 'admin') && (
                        <div className="flex flex-col items-end gap-2">
                            {!isToday && (
                                <span className="text-xs text-amber-600 bg-amber-50 px-2 py-1 rounded">
                                    Dispatch only available for today
                                </span>
                            )}
                            <div className="flex gap-2">
                                <button
                                    onClick={handleBulkCreate}
                                    disabled={!isToday || availableTankersForDay.length === 0}
                                    className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium text-sm transition-colors border ${!isToday || availableTankersForDay.length === 0
                                        ? 'bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed'
                                        : 'bg-white text-blue-600 border-blue-200 hover:bg-blue-50'
                                        }`}
                                    title="Dispatch all available tankers"
                                >
                                    <Layers className="h-4 w-4" />
                                    Bulk Dispatch ({availableTankersForDay.length})
                                </button>
                                <button
                                    onClick={() => setShowCreateModal(true)}
                                    disabled={!isToday || availableTankersForDay.length === 0}
                                    className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium text-sm transition-colors ${!isToday || availableTankersForDay.length === 0
                                        ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                                        : 'bg-blue-600 text-white hover:bg-blue-700'
                                        }`}
                                >
                                    <Plus className="h-4 w-4" />
                                    Dispatch Tanker
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                <StatCard label="Fleet Total" value={stats.fleetTotal} color="blue" />
                <StatCard
                    label="Dispatched Today"
                    value={stats.tankerDaysOpen}
                    color="sky"
                    highlight={userRole === 'encoder'}
                />
                <StatCard
                    label="Submitted"
                    value={stats.submitted}
                    color="yellow"
                    highlight={userRole === 'supervisor'}
                />
                <StatCard label="Locked" value={stats.locked} color="green" />
            </div>

            {/* Filters */}
            <div className="flex flex-wrap gap-4 mb-6">
                <div className="flex items-center gap-2">
                    <label className="text-sm font-medium text-gray-700">Status:</label>
                    <select
                        value={filterStatus}
                        onChange={(e) => setFilterStatus(e.target.value)}
                        className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                        <option value="ALL">All Statuses</option>
                        <option value="OPEN">Open</option>
                        <option value="SUBMITTED">Submitted</option>
                        <option value="LOCKED">Locked</option>
                    </select>
                </div>
                <div className="flex items-center gap-2">
                    <label className="text-sm font-medium text-gray-700">Tanker:</label>
                    <input
                        type="text"
                        value={filterTanker}
                        onChange={(e) => setFilterTanker(e.target.value)}
                        placeholder="Search plate number..."
                        className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 w-48"
                    />
                </div>
                {(filterStatus !== 'ALL' || filterTanker) && (
                    <button
                        onClick={() => {
                            setFilterStatus('ALL')
                            setFilterTanker('')
                        }}
                        className="px-3 py-2 text-sm text-gray-600 hover:text-gray-900 flex items-center gap-1"
                    >
                        <X className="h-4 w-4" />
                        Clear filters
                    </button>
                )}
            </div>

            {/* Tanker Operations Table */}
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center">
                    <h2 className="text-lg font-semibold text-gray-900">
                        {userRole === 'supervisor' ? 'Pending Reviews' : 'Tanker Operations'}
                    </h2>
                    {userRole === 'supervisor' && stats.submitted > 0 && (
                        <span className="px-3 py-1 bg-yellow-100 text-yellow-700 rounded-full text-sm font-medium">
                            {stats.submitted} awaiting review
                        </span>
                    )}
                </div>

                {loading ? (
                    <div className="flex justify-center py-12">
                        <div className="animate-spin h-8 w-8 border-4 border-blue-600 border-t-transparent rounded-full" />
                    </div>
                ) : filteredTankerDays.length === 0 ? (
                    <div className="text-center py-12">
                        <Truck className="h-12 w-12 mx-auto text-gray-300 mb-4" />
                        <h3 className="text-lg font-medium text-gray-900 mb-2">
                            {userRole === 'supervisor' ? 'No Pending Reviews' : 'No Tanker Days'}
                        </h3>
                        <p className="text-gray-500 mb-4">
                            {userRole === 'supervisor'
                                ? 'All tanker days have been reviewed.'
                                : 'No operations scheduled for this date.'}
                        </p>
                        {(userRole === 'encoder' || userRole === 'admin') && availableTankersForDay.length > 0 && (
                            <button
                                onClick={() => setShowCreateModal(true)}
                                className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                            >
                                <Plus className="h-4 w-4" />
                                Create Tanker Day
                            </button>
                        )}
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead>
                                <tr className="border-b border-gray-100">
                                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Tanker</th>
                                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Driver</th>
                                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Trips</th>
                                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Liters Delivered</th>
                                    <th className="px-6 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50">
                                {filteredTankerDays.map((tanker) => (
                                    <tr key={tanker.id} className="hover:bg-gray-50 transition-colors">
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className="p-2 bg-blue-50 rounded-lg">
                                                    <Truck className="h-5 w-5 text-blue-600" />
                                                </div>
                                                <span className="font-semibold text-gray-900">{tanker.plateNumber}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-gray-600">{tanker.driver}</td>
                                        <td className="px-6 py-4">{getStatusBadge(tanker.status)}</td>
                                        <td className="px-6 py-4">
                                            <span className="font-medium text-gray-900">{tanker.tripsCompleted}</span>
                                            <span className="text-gray-400">/{tanker.totalTrips}</span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className="font-medium text-gray-900">{tanker.litersDelivered.toLocaleString()}</span>
                                            <span className="text-gray-400 ml-1">L</span>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <Link
                                                href={`/tanker-days/${tanker.id}`}
                                                className="inline-flex items-center gap-1 text-blue-600 hover:text-blue-800 font-medium text-sm"
                                            >
                                                {userRole === 'supervisor' && tanker.status === 'SUBMITTED' ? (
                                                    <>
                                                        <Eye className="h-4 w-4" />
                                                        Review
                                                    </>
                                                ) : (
                                                    <>
                                                        View Details
                                                        <ChevronRight className="h-4 w-4" />
                                                    </>
                                                )}
                                            </Link>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* Create Tanker Day Modal */}
            <Modal
                isOpen={showCreateModal}
                onClose={() => setShowCreateModal(false)}
                title="Create Tanker Day"
                size="lg"
            >
                <div className="space-y-6">
                    <div className="p-4 bg-blue-50 rounded-lg">
                        <div className="flex items-center gap-2 text-blue-800 font-medium mb-1">
                            <Calendar className="h-4 w-4" />
                            Business Date: {format(new Date(businessDate), 'EEEE, MMMM d, yyyy')}
                        </div>
                        <p className="text-sm text-blue-600">Select a tanker for this day's operations. Driver and Porter are assigned per trip.</p>
                    </div>

                    {/* Tanker Selection */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Select Tanker</label>
                        {availableTankersForDay.length === 0 ? (
                            <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg text-yellow-800 text-sm">
                                All tankers are already assigned for this date.
                            </div>
                        ) : (
                            <div className="grid grid-cols-2 gap-3">
                                {availableTankersForDay.map((tanker: Tanker) => (
                                    <button
                                        key={tanker.id}
                                        onClick={() => setCreateForm({ ...createForm, tankerId: tanker.id })}
                                        className={`p-4 border rounded-lg text-left transition-all ${createForm.tankerId === tanker.id
                                            ? 'border-blue-500 bg-blue-50 ring-2 ring-blue-200'
                                            : 'border-gray-200 hover:border-blue-300'
                                            }`}
                                    >
                                        <div className="flex items-center gap-3 mb-2">
                                            <Truck className={`h-5 w-5 ${createForm.tankerId === tanker.id ? 'text-blue-600' : 'text-gray-400'}`} />
                                            <span className="font-semibold text-gray-900">{tanker.plateNumber}</span>
                                        </div>
                                        <div className="text-sm text-gray-500">
                                            {tanker.capacity.toLocaleString()}L • {tanker.compartments} compartments
                                        </div>
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Actions */}
                    <div className="flex gap-3 pt-4 border-t border-gray-100">
                        <button
                            onClick={() => setShowCreateModal(false)}
                            className="flex-1 px-4 py-2 border border-gray-200 rounded-lg hover:bg-gray-50"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={handleCreateTankerDay}
                            disabled={!createForm.tankerId}
                            className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                        >
                            <Plus className="h-4 w-4" />
                            Dispatch Tanker
                        </button>
                    </div>
                </div>
            </Modal>
        </div>
    )
}

function StatCard({
    label,
    value,
    color,
    highlight = false
}: {
    label: string
    value: number
    color: string
    highlight?: boolean
}) {
    const colors: Record<string, string> = {
        blue: 'bg-blue-50 border-blue-100',
        sky: 'bg-sky-50 border-sky-100',
        yellow: 'bg-yellow-50 border-yellow-100',
        green: 'bg-green-50 border-green-100',
    }

    return (
        <div className={`p-5 rounded-xl border ${colors[color]} bg-white ${highlight ? 'ring-2 ring-blue-500 ring-offset-2' : ''}`}>
            <div className="text-3xl font-bold text-gray-900 mb-1">{value}</div>
            <div className="text-sm text-gray-500 font-medium">{label}</div>
        </div>
    )
}
