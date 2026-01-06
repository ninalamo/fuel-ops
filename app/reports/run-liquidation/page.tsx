'use client'

import { useState } from 'react'
import { DateRangePicker } from '@/components/reports/DateRangePicker'
import { ExportButton } from '@/components/reports/ExportButton'
import { ReportTable, Column } from '@/components/reports/ReportTable'
import type { RunLiquidationRow } from '@/lib/types'
import Link from 'next/link'
import { ArrowLeft, AlertTriangle } from 'lucide-react'

export default function RunLiquidationPage() {
    const [dateFrom, setDateFrom] = useState('')
    const [dateTo, setDateTo] = useState('')
    const [data, setData] = useState<RunLiquidationRow[]>([])
    const [loading, setLoading] = useState(false)
    const [varianceOnly, setVarianceOnly] = useState(false)
    const [missingPodOnly, setMissingPodOnly] = useState(false)

    const fetchData = async (from: string, to: string) => {
        setLoading(true)
        setDateFrom(from)
        setDateTo(to)

        try {
            const params = new URLSearchParams({
                dateFrom: from,
                dateTo: to,
                ...(varianceOnly && { varianceOnly: 'true' }),
                ...(missingPodOnly && { missingPodOnly: 'true' }),
            })
            const response = await fetch(`/api/reports/run-liquidation?${params}`)
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
            ...(varianceOnly && { varianceOnly: 'true' }),
            ...(missingPodOnly && { missingPodOnly: 'true' }),
        })
        const response = await fetch(`/api/reports/run-liquidation?${params}&format=csv`)
        const blob = await response.blob()
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `run-liquidation_${dateFrom}_${dateTo}.csv`
        document.body.appendChild(a)
        a.click()
        window.URL.revokeObjectURL(url)
        document.body.removeChild(a)
    }

    const columns: Column<RunLiquidationRow>[] = [
        { key: 'date', header: 'Date' },
        {
            key: 'runNumber',
            header: 'Run Number',
            render: (row) => <span className="font-medium font-mono text-sm">{row.runNumber}</span>,
        },
        { key: 'tanker', header: 'Tanker' },
        { key: 'driver', header: 'Driver' },
        { key: 'porter', header: 'Porter' },
        {
            key: 'upliftTotalOverall',
            header: 'Uplift (L)',
            render: (row) => row.upliftTotalOverall.toLocaleString(),
        },
        {
            key: 'dropTotalOverall',
            header: 'Delivered (L)',
            render: (row) => row.dropTotalOverall.toLocaleString(),
        },
        {
            key: 'heelTotalOverall',
            header: 'Heel (L)',
            render: (row) => row.heelTotalOverall.toLocaleString(),
        },
        {
            key: 'variance',
            header: 'Variance',
            render: (row) =>
                row.hasVariance ? (
                    <div className="flex items-center gap-1 text-red-600 font-semibold">
                        <AlertTriangle className="h-4 w-4" />
                        {row.variance > 0 ? '+' : ''}
                        {row.variance.toLocaleString()} L
                    </div>
                ) : (
                    <span className="text-green-600">✓ OK</span>
                ),
        },
        {
            key: 'missingPodCount',
            header: 'Missing POD',
            render: (row) =>
                row.missingPodCount > 0 ? (
                    <span className="text-red-600 font-semibold">{row.missingPodCount}</span>
                ) : (
                    <span className="text-gray-400">-</span>
                ),
        },
        {
            key: 'runId',
            header: 'Action',
            render: (row) => (
                <Link
                    href={`/runs/${row.runId}`}
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
                <div className="mb-6">
                    <Link
                        href="/reports"
                        className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4"
                    >
                        <ArrowLeft className="h-4 w-4" />
                        Back to Reports
                    </Link>
                    <h1 className="text-3xl font-bold text-gray-900 mb-2">
                        Dispatch Run Liquidation
                    </h1>
                    <p className="text-gray-600">
                        Uplift, drop, and heel totals per run with variance tracking
                    </p>
                </div>

                <div className="bg-white rounded-lg shadow-md p-6 mb-6">
                    <div className="space-y-4">
                        <div className="flex flex-wrap items-end gap-4">
                            <DateRangePicker onDateChange={fetchData} />
                            {data.length > 0 && (
                                <ExportButton onClick={handleExport} filename="run-liquidation" />
                            )}
                        </div>

                        {/* Additional Filters */}
                        <div className="flex gap-4 pt-4 border-t">
                            <label className="flex items-center gap-2 cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={varianceOnly}
                                    onChange={(e) => {
                                        setVarianceOnly(e.target.checked)
                                        if (dateFrom && dateTo) fetchData(dateFrom, dateTo)
                                    }}
                                    className="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                                />
                                <span className="text-sm font-medium text-gray-700">Variance Only</span>
                            </label>
                            <label className="flex items-center gap-2 cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={missingPodOnly}
                                    onChange={(e) => {
                                        setMissingPodOnly(e.target.checked)
                                        if (dateFrom && dateTo) fetchData(dateFrom, dateTo)
                                    }}
                                    className="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                                />
                                <span className="text-sm font-medium text-gray-700">Missing POD Only</span>
                            </label>
                        </div>
                    </div>
                </div>

                <ReportTable columns={columns} data={data} loading={loading} />
            </div>
        </div>
    )
}
