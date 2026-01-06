'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { format } from 'date-fns'
import {
    Plus,
    Search,
    Filter,
    ArrowLeft,
    Truck,
    Calendar,
    CheckCircle,
    Clock,
    AlertCircle
} from 'lucide-react'

interface Program {
    id: string
    date: string
    tankerId: string
    tanker: { plateNumber: string; capacity: number }
    status: string
    totalPlannedLiters: number
    totalServedLiters: number
    runsCount: number
}

export default function ProgramsPage() {
    const [programs, setPrograms] = useState<Program[]>([])
    const [loading, setLoading] = useState(true)
    const [filter, setFilter] = useState<'all' | 'today' | 'upcoming' | 'completed'>('all')

    useEffect(() => {
        fetchPrograms()
    }, [])

    const fetchPrograms = async () => {
        setLoading(true)
        try {
            const res = await fetch('/api/programs')
            const data = await res.json()
            setPrograms(data)
        } catch (error) {
            console.error('Error fetching programs:', error)
        } finally {
            setLoading(false)
        }
    }

    const getStatusBadge = (status: string) => {
        const styles: Record<string, { bg: string; icon: typeof CheckCircle }> = {
            COMPLETED: { bg: 'bg-green-100 text-green-800', icon: CheckCircle },
            IN_PROGRESS: { bg: 'bg-blue-100 text-blue-800', icon: Clock },
            APPROVED: { bg: 'bg-purple-100 text-purple-800', icon: CheckCircle },
            DRAFT: { bg: 'bg-gray-100 text-gray-800', icon: AlertCircle },
            CANCELLED: { bg: 'bg-red-100 text-red-800', icon: AlertCircle },
        }
        const style = styles[status] || styles.DRAFT
        const Icon = style.icon

        return (
            <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${style.bg}`}>
                <Icon className="h-3 w-3" />
                {status.replace('_', ' ')}
            </span>
        )
    }

    const filteredPrograms = programs.filter(prog => {
        if (filter === 'all') return true
        const today = format(new Date(), 'yyyy-MM-dd')
        if (filter === 'today') return prog.date === today
        if (filter === 'upcoming') return prog.date > today
        if (filter === 'completed') return prog.status === 'COMPLETED'
        return true
    })

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* Header */}
                <div className="flex flex-wrap justify-between items-center gap-4 mb-6">
                    <div>
                        <Link
                            href="/dashboard"
                            className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-2"
                        >
                            <ArrowLeft className="h-4 w-4" />
                            Back to Dashboard
                        </Link>
                        <h1 className="text-3xl font-bold text-gray-900">Daily Programs</h1>
                        <p className="text-gray-600">Manage and monitor fuel dispatch programs</p>
                    </div>
                    <Link
                        href="/programs/new"
                        className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                    >
                        <Plus className="h-5 w-5" />
                        New Program
                    </Link>
                </div>

                {/* Filters */}
                <div className="flex flex-wrap gap-2 mb-6">
                    {(['all', 'today', 'upcoming', 'completed'] as const).map(f => (
                        <button
                            key={f}
                            onClick={() => setFilter(f)}
                            className={`px-4 py-2 rounded-lg font-medium text-sm transition-colors ${filter === f
                                    ? 'bg-blue-600 text-white'
                                    : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-200'
                                }`}
                        >
                            {f === 'all' ? 'All Programs' : f.charAt(0).toUpperCase() + f.slice(1)}
                        </button>
                    ))}
                </div>

                {/* Programs List */}
                {loading ? (
                    <div className="flex justify-center py-12">
                        <div className="animate-spin h-8 w-8 border-4 border-blue-600 border-t-transparent rounded-full" />
                    </div>
                ) : filteredPrograms.length === 0 ? (
                    <div className="text-center py-12 bg-white rounded-lg border border-gray-200">
                        <Calendar className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                        <h3 className="text-lg font-medium text-gray-900 mb-2">No Programs Found</h3>
                        <p className="text-gray-600 mb-4">
                            {filter === 'all' ? 'Get started by creating your first program.' : 'No programs match this filter.'}
                        </p>
                        <Link
                            href="/programs/new"
                            className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                        >
                            <Plus className="h-4 w-4" />
                            Create Program
                        </Link>
                    </div>
                ) : (
                    <div className="grid gap-4">
                        {filteredPrograms.map(program => (
                            <Link
                                key={program.id}
                                href={`/programs/${program.id}`}
                                className="block bg-white rounded-xl shadow-sm border border-gray-200 hover:shadow-md hover:border-blue-300 transition-all p-5"
                            >
                                <div className="flex flex-wrap justify-between items-start gap-4">
                                    <div className="flex items-start gap-4">
                                        <div className="p-3 bg-blue-100 rounded-lg">
                                            <Truck className="h-6 w-6 text-blue-600" />
                                        </div>
                                        <div>
                                            <div className="flex items-center gap-3 mb-1">
                                                <span className="font-semibold text-gray-900">
                                                    {program.tanker.plateNumber}
                                                </span>
                                                {getStatusBadge(program.status)}
                                            </div>
                                            <div className="text-sm text-gray-600">
                                                <span className="font-medium">{format(new Date(program.date), 'EEEE, MMMM d, yyyy')}</span>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex gap-6 text-center">
                                        <div>
                                            <div className="text-2xl font-bold text-gray-900">
                                                {program.runsCount}
                                            </div>
                                            <div className="text-xs text-gray-500">Runs</div>
                                        </div>
                                        <div>
                                            <div className="text-2xl font-bold text-blue-600">
                                                {(program.totalPlannedLiters / 1000).toFixed(0)}K
                                            </div>
                                            <div className="text-xs text-gray-500">Planned (L)</div>
                                        </div>
                                        <div>
                                            <div className="text-2xl font-bold text-green-600">
                                                {(program.totalServedLiters / 1000).toFixed(0)}K
                                            </div>
                                            <div className="text-xs text-gray-500">Served (L)</div>
                                        </div>
                                    </div>
                                </div>

                                {/* Progress bar */}
                                <div className="mt-4">
                                    <div className="flex justify-between text-xs text-gray-500 mb-1">
                                        <span>Delivery Progress</span>
                                        <span>
                                            {program.totalPlannedLiters > 0
                                                ? ((program.totalServedLiters / program.totalPlannedLiters) * 100).toFixed(0)
                                                : 0}%
                                        </span>
                                    </div>
                                    <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
                                        <div
                                            className="h-full bg-gradient-to-r from-blue-500 to-green-500 transition-all duration-300"
                                            style={{
                                                width: `${program.totalPlannedLiters > 0
                                                    ? (program.totalServedLiters / program.totalPlannedLiters) * 100
                                                    : 0}%`
                                            }}
                                        />
                                    </div>
                                </div>
                            </Link>
                        ))}
                    </div>
                )}
            </div>
        </div>
    )
}
