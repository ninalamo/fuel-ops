'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { format } from 'date-fns'
import {
    ArrowLeft,
    Truck,
    User,
    Clock,
    MapPin,
    Package,
    AlertTriangle,
    CheckCircle,
    Camera,
    ChevronRight
} from 'lucide-react'

interface RunDetail {
    id: string
    runNumber: string
    tanker: string
    driver: string
    porter: string
    status: string
    startTime: string | null
    endTime: string | null
    uplifts: Array<{
        id: string
        fuelType: string
        plannedLiters: number
        actualLiters: number | null
        depot: string
    }>
    drops: Array<{
        id: string
        station: string
        fuelType: string
        sequenceNo: number
        plannedLiters: number
        actualLiters: number | null
        drReference: string | null
        podAttachmentCount: number
    }>
    heels: Array<{
        fuelType: string
        actualLiters: number
        expectedLiters: number | null
        variance: number | null
    }>
    exceptions: Array<{
        id: string
        type: string
        severity: string
        message: string
    }>
}

export default function RunsPage() {
    const [runs, setRuns] = useState<RunDetail[]>([])
    const [loading, setLoading] = useState(true)
    const [filter, setFilter] = useState<'all' | 'active' | 'completed' | 'pending'>('all')

    useEffect(() => {
        fetchRuns()
    }, [])

    const fetchRuns = async () => {
        setLoading(true)
        try {
            const res = await fetch('/api/runs')
            const data = await res.json()
            setRuns(data)
        } catch (error) {
            console.error('Error fetching runs:', error)
        } finally {
            setLoading(false)
        }
    }

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'COMPLETED': return 'bg-green-100 text-green-800 border-green-200'
            case 'IN_TRANSIT': return 'bg-blue-100 text-blue-800 border-blue-200'
            case 'PENDING': return 'bg-yellow-100 text-yellow-800 border-yellow-200'
            default: return 'bg-gray-100 text-gray-800 border-gray-200'
        }
    }

    const filteredRuns = runs.filter(run => {
        if (filter === 'all') return true
        if (filter === 'active') return run.status === 'IN_TRANSIT'
        if (filter === 'completed') return run.status === 'COMPLETED'
        if (filter === 'pending') return run.status === 'PENDING'
        return true
    })

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* Header */}
                <div className="mb-6">
                    <Link
                        href="/dashboard"
                        className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-2"
                    >
                        <ArrowLeft className="h-4 w-4" />
                        Back to Dashboard
                    </Link>
                    <h1 className="text-3xl font-bold text-gray-900">Dispatch Runs</h1>
                    <p className="text-gray-600">Track and manage fuel delivery runs</p>
                </div>

                {/* Filters */}
                <div className="flex flex-wrap gap-2 mb-6">
                    {(['all', 'active', 'pending', 'completed'] as const).map(f => (
                        <button
                            key={f}
                            onClick={() => setFilter(f)}
                            className={`px-4 py-2 rounded-lg font-medium text-sm transition-colors ${filter === f
                                    ? 'bg-blue-600 text-white'
                                    : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-200'
                                }`}
                        >
                            {f === 'all' ? 'All Runs' : f.charAt(0).toUpperCase() + f.slice(1)}
                        </button>
                    ))}
                </div>

                {/* Runs List */}
                {loading ? (
                    <div className="flex justify-center py-12">
                        <div className="animate-spin h-8 w-8 border-4 border-blue-600 border-t-transparent rounded-full" />
                    </div>
                ) : filteredRuns.length === 0 ? (
                    <div className="text-center py-12 bg-white rounded-lg border border-gray-200">
                        <Truck className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                        <h3 className="text-lg font-medium text-gray-900 mb-2">No Runs Found</h3>
                        <p className="text-gray-600">
                            {filter === 'all' ? 'No dispatch runs available.' : 'No runs match this filter.'}
                        </p>
                    </div>
                ) : (
                    <div className="grid gap-4">
                        {filteredRuns.map(run => (
                            <Link
                                key={run.id}
                                href={`/runs/${run.id}`}
                                className="block bg-white rounded-xl shadow-sm border border-gray-200 hover:shadow-md hover:border-blue-300 transition-all overflow-hidden"
                            >
                                <div className="p-5">
                                    {/* Run Header */}
                                    <div className="flex flex-wrap justify-between items-start gap-4 mb-4">
                                        <div className="flex items-center gap-4">
                                            <div className={`p-3 rounded-lg ${run.status === 'IN_TRANSIT' ? 'bg-blue-100' :
                                                    run.status === 'COMPLETED' ? 'bg-green-100' : 'bg-yellow-100'
                                                }`}>
                                                <Truck className={`h-6 w-6 ${run.status === 'IN_TRANSIT' ? 'text-blue-600' :
                                                        run.status === 'COMPLETED' ? 'text-green-600' : 'text-yellow-600'
                                                    }`} />
                                            </div>
                                            <div>
                                                <div className="flex items-center gap-3">
                                                    <span className="font-mono font-semibold text-gray-900">
                                                        {run.runNumber}
                                                    </span>
                                                    <span className={`px-2 py-1 rounded-full text-xs font-medium border ${getStatusColor(run.status)}`}>
                                                        {run.status.replace('_', ' ')}
                                                    </span>
                                                </div>
                                                <div className="text-sm text-gray-600 mt-1">
                                                    <span className="font-medium">{run.tanker}</span>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-1 text-gray-400">
                                            <span className="text-sm">View Details</span>
                                            <ChevronRight className="h-4 w-4" />
                                        </div>
                                    </div>

                                    {/* Run Info Grid */}
                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                                        <div className="flex items-center gap-2 text-sm">
                                            <User className="h-4 w-4 text-gray-400" />
                                            <span className="text-gray-600">{run.driver}</span>
                                        </div>
                                        <div className="flex items-center gap-2 text-sm">
                                            <User className="h-4 w-4 text-gray-400" />
                                            <span className="text-gray-600">{run.porter}</span>
                                        </div>
                                        {run.startTime && (
                                            <div className="flex items-center gap-2 text-sm">
                                                <Clock className="h-4 w-4 text-gray-400" />
                                                <span className="text-gray-600">
                                                    {format(new Date(run.startTime), 'h:mm a')}
                                                </span>
                                            </div>
                                        )}
                                        <div className="flex items-center gap-2 text-sm">
                                            <Package className="h-4 w-4 text-gray-400" />
                                            <span className="text-gray-600">
                                                {run.drops.filter(d => d.actualLiters !== null).length}/{run.drops.length} drops
                                            </span>
                                        </div>
                                    </div>

                                    {/* Progress */}
                                    <div className="mb-4">
                                        <div className="flex justify-between text-xs text-gray-500 mb-1">
                                            <span>Delivery Progress</span>
                                            <span>
                                                {((run.drops.filter(d => d.actualLiters !== null).length / run.drops.length) * 100).toFixed(0)}%
                                            </span>
                                        </div>
                                        <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
                                            <div
                                                className="h-full bg-gradient-to-r from-blue-500 to-green-500 transition-all duration-300"
                                                style={{ width: `${(run.drops.filter(d => d.actualLiters !== null).length / run.drops.length) * 100}%` }}
                                            />
                                        </div>
                                    </div>

                                    {/* Stations Preview */}
                                    <div className="flex flex-wrap gap-2">
                                        {run.drops.slice(0, 4).map((drop, idx) => (
                                            <div
                                                key={drop.id}
                                                className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-sm ${drop.actualLiters !== null
                                                        ? 'bg-green-50 text-green-700 border border-green-200'
                                                        : 'bg-gray-50 text-gray-600 border border-gray-200'
                                                    }`}
                                            >
                                                <span className="font-medium">{idx + 1}.</span>
                                                <MapPin className="h-3 w-3" />
                                                <span>{drop.station}</span>
                                                {drop.actualLiters !== null && <CheckCircle className="h-3 w-3 text-green-600" />}
                                                {drop.actualLiters !== null && drop.podAttachmentCount === 0 && (
                                                    <Camera className="h-3 w-3 text-orange-500" />
                                                )}
                                            </div>
                                        ))}
                                        {run.drops.length > 4 && (
                                            <span className="px-3 py-1.5 text-sm text-gray-500">
                                                +{run.drops.length - 4} more
                                            </span>
                                        )}
                                    </div>

                                    {/* Exceptions */}
                                    {run.exceptions.length > 0 && (
                                        <div className="mt-4 flex items-center gap-2 text-red-600 text-sm">
                                            <AlertTriangle className="h-4 w-4" />
                                            <span>{run.exceptions.length} exception(s) flagged</span>
                                        </div>
                                    )}
                                </div>
                            </Link>
                        ))}
                    </div>
                )}
            </div>
        </div>
    )
}
