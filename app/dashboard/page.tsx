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
    totalTankers: number
    open: number
    submitted: number
    locked: number
}

// Mock tankers for selection
const AVAILABLE_TANKERS = [
    { id: 'tanker-1', plateNumber: 'ABC-1234', capacity: 30000, compartments: 4 },
    { id: 'tanker-2', plateNumber: 'XYZ-5678', capacity: 25000, compartments: 3 },
    { id: 'tanker-3', plateNumber: 'DEF-9012', capacity: 20000, compartments: 2 },
    { id: 'tanker-4', plateNumber: 'GHI-3456', capacity: 35000, compartments: 5 },
]

const AVAILABLE_DRIVERS = ['Juan Cruz', 'Pedro Santos', 'Maria Garcia', 'Jose Reyes', 'Miguel Torres']
const AVAILABLE_PORTERS = ['Carlos Lopez', 'Ana Mendez', 'Luis Torres', 'Rosa Fernandez']

export default function DashboardPage() {
    const [tankerDays, setTankerDays] = useState<TankerDay[]>([])
    const [stats, setStats] = useState<DashboardStats>({ totalTankers: 0, open: 0, submitted: 0, locked: 0 })
    const [loading, setLoading] = useState(true)
    const [businessDate, setBusinessDate] = useState(format(new Date(), 'yyyy-MM-dd'))
    const [userRole, setUserRole] = useState<string | null>(null)

    // Create Tanker Day Modal
    const [showCreateModal, setShowCreateModal] = useState(false)
    const [createForm, setCreateForm] = useState({
        tankerId: '',
    })

    useEffect(() => {
        const role = localStorage.getItem('userRole')
        setUserRole(role)
        fetchData()
    }, [businessDate])

    const fetchData = async () => {
        setLoading(true)
        try {
            const res = await fetch(`/api/tanker-days?date=${businessDate}`)
            const data = await res.json()
            setTankerDays(data.tankerDays)
            setStats(data.stats)
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
            setStats({ ...stats, totalTankers: stats.totalTankers + 1, open: stats.open + 1 })
            setShowCreateModal(false)
            setCreateForm({ tankerId: '' })
        } catch (error) {
            console.error('Failed to create tanker day:', error)
            alert('An error occurred while creating the tanker day')
        }
    }

    const handleBulkCreate = () => {
        const assignedIds = tankerDays.map(td => td.tankerId)
        const toCreate = AVAILABLE_TANKERS.filter(t => !assignedIds.includes(t.id))

        if (toCreate.length === 0) return

        const newDays: TankerDay[] = toCreate.map(t => ({
            id: `td-${businessDate}-${t.id}`,
            date: businessDate,
            tankerId: t.id,
            plateNumber: t.plateNumber,
            driver: '',
            status: 'OPEN',
            tripsCompleted: 0,
            totalTrips: 0,
            litersDelivered: 0,
            hasExceptions: false,
        }))

        setTankerDays([...tankerDays, ...newDays])
        setStats({
            ...stats,
            totalTankers: stats.totalTankers + newDays.length,
            open: stats.open + newDays.length
        })
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

    // Filter tanker days based on role
    const filteredTankerDays = tankerDays.filter(td => {
        if (userRole === 'validator' || userRole === 'supervisor') {
            // Both roles see Submitted and Locked records
            return td.status === 'SUBMITTED' || td.status === 'LOCKED'
        }
        return true
    })

    // Get tankers already assigned today
    const assignedTankerIds = tankerDays.map(td => td.tankerId)
    const availableTankersForDay = AVAILABLE_TANKERS.filter(t => !assignedTankerIds.includes(t.id))

    const getRoleTitle = () => {
        switch (userRole) {
            case 'encoder': return 'Fleet Dashboard'
            case 'validator': return 'Review Queue'
            case 'supervisor': return 'Supervisor Dashboard'
            case 'admin': return 'Admin Dashboard'
            default: return 'Dashboard'
        }
    }

    const getRoleSubtitle = () => {
        switch (userRole) {
            case 'encoder': return 'Manage tanker daily operations, trips, and fuel recording'
            case 'validator': return 'Review and approve submitted tanker day records'
            case 'supervisor': return 'Oversight and POD verification'
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
                        <div className="flex gap-2">
                            <button
                                onClick={handleBulkCreate}
                                disabled={businessDate !== format(new Date(), 'yyyy-MM-dd') || availableTankersForDay.length === 0}
                                className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium text-sm transition-colors border ${businessDate !== format(new Date(), 'yyyy-MM-dd') || availableTankersForDay.length === 0
                                    ? 'bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed'
                                    : 'bg-white text-blue-600 border-blue-200 hover:bg-blue-50'
                                    }`}
                                title="Open days for all unassigned tankers"
                            >
                                <Layers className="h-4 w-4" />
                                Bulk Open ({availableTankersForDay.length})
                            </button>
                            <button
                                onClick={() => setShowCreateModal(true)}
                                disabled={businessDate !== format(new Date(), 'yyyy-MM-dd')}
                                className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium text-sm transition-colors ${businessDate !== format(new Date(), 'yyyy-MM-dd')
                                    ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                                    : 'bg-blue-600 text-white hover:bg-blue-700'
                                    }`}
                                title={businessDate !== format(new Date(), 'yyyy-MM-dd') ? 'Tanker days can only be created for today' : ''}
                            >
                                <Plus className="h-4 w-4" />
                                Create Tanker Day
                            </button>
                        </div>
                    )}
                </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                <StatCard label="Total Tankers" value={stats.totalTankers} color="blue" />
                <StatCard
                    label="Open"
                    value={stats.open}
                    color="sky"
                    highlight={userRole === 'encoder'}
                />
                <StatCard
                    label="Submitted"
                    value={stats.submitted}
                    color="yellow"
                    highlight={userRole === 'validator' || userRole === 'supervisor'}
                />
                <StatCard label="Locked" value={stats.locked} color="green" />
            </div>

            {/* Tanker Operations Table */}
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center">
                    <h2 className="text-lg font-semibold text-gray-900">
                        {userRole === 'validator' ? 'Pending Reviews' : 'Tanker Operations'}
                    </h2>
                    {(userRole === 'validator' || userRole === 'supervisor') && stats.submitted > 0 && (
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
                            {userRole === 'validator' ? 'No Pending Reviews' : 'No Tanker Days'}
                        </h3>
                        <p className="text-gray-500 mb-4">
                            {userRole === 'validator'
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
                                                {userRole === 'validator' && tanker.status === 'SUBMITTED' ? (
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
                                {availableTankersForDay.map(tanker => (
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
                            Create Tanker Day
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
