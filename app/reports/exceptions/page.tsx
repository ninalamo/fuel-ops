'use client'

import { useState } from 'react'
import { DateRangePicker } from '@/components/reports/DateRangePicker'
import { ExportButton } from '@/components/reports/ExportButton'
import { ReportTable, Column } from '@/components/reports/ReportTable'
import type { ExceptionRow, ExceptionType, ExceptionSeverity } from '@/lib/types'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { format } from 'date-fns'

export default function ExceptionsPage() {
    const [dateFrom, setDateFrom] = useState('')
    const [dateTo, setDateTo] = useState('')
    const [data, setData] = useState<ExceptionRow[]>([])
    const [loading, setLoading] = useState(false)
    const [unclearedOnly, setUnclearedOnly] = useState(false)

    const fetchData = async (from: string, to: string) => {
        setLoading(true)
        setDateFrom(from)
        setDateTo(to)

        try {
            const params = new URLSearchParams({
                dateFrom: from,
                dateTo: to,
                ...(unclearedOnly && { unclearedOnly: 'true' }),
            })
            const response = await fetch(`/api/reports/exceptions?${params}`)
            const result = await response.json()
            setData(result)
        } catch (error) {
            console.error('Error fetching report:', error)
        } finally {
            setLoading(false)
        }
    }

    const handleExport = async () => {
        const params = new URLSearchParams({
            dateFrom,
            dateTo,
            ...(unclearedOnly && { unclearedOnly: 'true' }),
        })
        const response = await fetch(`/api/reports/exceptions?${params}&format=csv`)
        const blob = await response.blob()
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `exceptions_${dateFrom}_${dateTo}.csv`
        document.body.appendChild(a)
        a.click()
        window.URL.revokeObjectURL(url)
        document.body.removeChild(a)
    }

    const getSeverityBadge = (severity: ExceptionSeverity) => {
        const styles = {
            LOW: 'bg-blue-100 text-blue-800',
            MEDIUM: 'bg-yellow-100 text-yellow-800',
            HIGH: 'bg-orange-100 text-orange-800',
            CRITICAL: 'bg-red-100 text-red-800',
        }
        return (
            <span className={`px-2 py-1 rounded-full text-xs font-semibold ${styles[severity]}`}>
                {severity}
            </span>
        )
    }

    const getTypeBadge = (type: ExceptionType) => {
        const styles = {
            VARIANCE: 'bg-red-50 text-red-700 border-red-200',
            MISSING_POD: 'bg-orange-50 text-orange-700 border-orange-200',
            LATE_DELIVERY: 'bg-yellow-50 text-yellow-700 border-yellow-200',
            OTHER: 'bg-gray-50 text-gray-700 border-gray-200',
        }
        return (
            <span className={`px-2 py-1 rounded text-xs font-medium border ${styles[type]}`}>
                {type.replace('_', ' ')}
            </span>
        )
    }

    const columns: Column<ExceptionRow>[] = [
        { key: 'date', header: 'Date' },
        {
            key: 'runNumber',
            header: 'Run',
            render: (row) => row.runNumber || '-',
        },
        { key: 'tanker', header: 'Tanker' },
        {
            key: 'type',
            header: 'Type',
            render: (row) => getTypeBadge(row.type),
        },
        {
            key: 'severity',
            header: 'Severity',
            render: (row) => getSeverityBadge(row.severity),
        },
        {
            key: 'message',
            header: 'Message',
            render: (row) => (
                <span className="text-sm max-w-xs truncate block" title={row.message}>
                    {row.message}
                </span>
            ),
        },
        {
            key: 'createdAt',
            header: 'Created',
            render: (row) => format(new Date(row.createdAt), 'MMM d, HH:mm'),
        },
        {
            key: 'clearedAt',
            header: 'Status',
            render: (row) =>
                row.clearedAt ? (
                    <span className="text-green-600 text-xs">
                        ✓ Cleared by {row.clearedBy}
                    </span>
                ) : (
                    <span className="text-red-600 font-semibold text-xs">OPEN</span>
                ),
        },
    ]

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <div className="mb-6">
                    <Link
                        href="/reports"
                        className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4"
                    >
                        <ArrowLeft className="h-4 w-4" />
                        Back to Reports
                    </Link>
                    <h1 className="text-3xl font-bold text-gray-900 mb-2">
                        Exceptions Register
                    </h1>
                    <p className="text-gray-600">
                        Monitor all gain/loss variances and missing PODs with clearing status
                    </p>
                </div>

                <div className="bg-white rounded-lg shadow-md p-6 mb-6">
                    <div className="space-y-4">
                        <div className="flex flex-wrap items-end gap-4">
                            <DateRangePicker onDateChange={fetchData} />
                            {data.length > 0 && (
                                <ExportButton onClick={handleExport} filename="exceptions" />
                            )}
                        </div>

                        <div className="flex gap-4 pt-4 border-t">
                            <label className="flex items-center gap-2 cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={unclearedOnly}
                                    onChange={(e) => {
                                        setUnclearedOnly(e.target.checked)
                                        if (dateFrom && dateTo) fetchData(dateFrom, dateTo)
                                    }}
                                    className="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                                />
                                <span className="text-sm font-medium text-gray-700">Uncleared Only</span>
                            </label>
                        </div>
                    </div>
                </div>

                <ReportTable columns={columns} data={data} loading={loading} />
            </div>
        </div>
    )
}
