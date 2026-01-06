'use client'

import { useState, useEffect } from 'react'
import { DateRangePicker } from '@/components/reports/DateRangePicker'
import { ExportButton } from '@/components/reports/ExportButton'
import { ReportTable, Column } from '@/components/reports/ReportTable'
import type { DailyProgramSummaryRow } from '@/lib/types'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'

export default function DailyProgramSummaryPage() {
    const [dateFrom, setDateFrom] = useState('')
    const [dateTo, setDateTo] = useState('')
    const [data, setData] = useState<DailyProgramSummaryRow[]>([])
    const [loading, setLoading] = useState(false)

    const fetchData = async (from: string, to: string) => {
        setLoading(true)
        setDateFrom(from)
        setDateTo(to)

        try {
            const params = new URLSearchParams({ dateFrom: from, dateTo: to })
            const response = await fetch(`/api/reports/daily-program-summary?${params}`)
            const result = await response.json()
            setData(result)
        } catch (error) {
            console.error('Error fetching report:', error)
        } finally {
            setLoading(false)
        }
    }

    const handleExport = async () => {
        const params = new URLSearchParams({ dateFrom, dateTo })
        const response = await fetch(`/api/reports/daily-program-summary?${params}&format=csv`)
        const blob = await response.blob()
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `daily-program-summary_${dateFrom}_${dateTo}.csv`
        document.body.appendChild(a)
        a.click()
        window.URL.revokeObjectURL(url)
        document.body.removeChild(a)
    }

    const columns: Column<DailyProgramSummaryRow>[] = [
        {
            key: 'date',
            header: 'Date',
            render: (row) => row.date,
        },
        {
            key: 'tanker',
            header: 'Tanker',
            render: (row) => <span className="font-medium">{row.tanker}</span>,
        },
        {
            key: 'status',
            header: 'Status',
            render: (row) => (
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${row.status === 'COMPLETED' ? 'bg-green-100 text-green-800' :
                        row.status === 'IN_PROGRESS' ? 'bg-blue-100 text-blue-800' :
                            row.status === 'APPROVED' ? 'bg-purple-100 text-purple-800' :
                                'bg-gray-100 text-gray-800'
                    }`}>
                    {row.status.replace('_', ' ')}
                </span>
            ),
        },
        {
            key: 'plannedLitersByProduct',
            header: 'Planned (L)',
            render: (row) => {
                const total = Object.values(row.plannedLitersByProduct).reduce((a, b) => a + b, 0)
                return total.toLocaleString()
            },
        },
        {
            key: 'servedLitersByProduct',
            header: 'Served (L)',
            render: (row) => {
                const total = Object.values(row.servedLitersByProduct).reduce((a, b) => a + b, 0)
                return total.toLocaleString()
            },
        },
        {
            key: 'pendingLitersByProduct',
            header: 'Pending (L)',
            render: (row) => {
                const total = Object.values(row.pendingLitersByProduct).reduce((a, b) => a + b, 0)
                return (
                    <span className={total > 0 ? 'text-orange-600 font-semibold' : ''}>
                        {total.toLocaleString()}
                    </span>
                )
            },
        },
        {
            key: 'runsCompleted',
            header: 'Runs',
        },
        {
            key: 'exceptionCounts',
            header: 'Exceptions',
            render: (row) => (
                <span className={row.exceptionCounts.total > 0 ? 'text-red-600 font-semibold' : ''}>
                    {row.exceptionCounts.total}
                </span>
            ),
        },
        {
            key: 'programId',
            header: 'Action',
            render: (row) => (
                <Link
                    href={`/programs/${row.programId}`}
                    className="text-blue-600 hover:text-blue-800 font-medium"
                >
                    View →
                </Link>
            ),
        },
    ]

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* Header */}
                <div className="mb-6">
                    <Link
                        href="/reports"
                        className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4"
                    >
                        <ArrowLeft className="h-4 w-4" />
                        Back to Reports
                    </Link>
                    <h1 className="text-3xl font-bold text-gray-900 mb-2">
                        Daily Program Summary
                    </h1>
                    <p className="text-gray-600">
                        Overview of planned vs served liters, runs completed, and exceptions per program
                    </p>
                </div>

                {/* Filters */}
                <div className="bg-white rounded-lg shadow-md p-6 mb-6">
                    <div className="flex flex-wrap items-end gap-4">
                        <DateRangePicker onDateChange={fetchData} />
                        {data.length > 0 && (
                            <ExportButton onClick={handleExport} filename="daily-program-summary" />
                        )}
                    </div>
                </div>

                {/* Table */}
                <ReportTable columns={columns} data={data} loading={loading} />
            </div>
        </div>
    )
}
