'use client'

import { useState } from 'react'
import { DateRangePicker } from '@/components/reports/DateRangePicker'
import { ExportButton } from '@/components/reports/ExportButton'
import { ReportTable, Column } from '@/components/reports/ReportTable'
import type { ProductivityRow } from '@/lib/types'
import Link from 'next/link'
import { ArrowLeft, TrendingUp } from 'lucide-react'

export default function ProductivityPage() {
    const [dateFrom, setDateFrom] = useState('')
    const [dateTo, setDateTo] = useState('')
    const [data, setData] = useState<ProductivityRow[]>([])
    const [loading, setLoading] = useState(false)
    const [groupBy, setGroupBy] = useState<'tanker' | 'driver'>('tanker')

    const fetchData = async (from: string, to: string) => {
        setLoading(true)
        setDateFrom(from)
        setDateTo(to)

        try {
            const params = new URLSearchParams({
                dateFrom: from,
                dateTo: to,
                groupBy,
            })
            const response = await fetch(`/api/reports/productivity?${params}`)
            const result = await response.json()
            setData(result)
        } catch (error) {
            console.error('Error fetching report:', error)
        } finally {
            setLoading(false)
        }
    }

    const handleExport = async () => {
        const params = new URLSearchParams({ dateFrom, dateTo, groupBy })
        const response = await fetch(`/api/reports/productivity?${params}&format=csv`)
        const blob = await response.blob()
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `productivity_${dateFrom}_${dateTo}.csv`
        document.body.appendChild(a)
        a.click()
        window.URL.revokeObjectURL(url)
        document.body.removeChild(a)
    }

    const columns: Column<ProductivityRow>[] = [
        {
            key: 'groupValue',
            header: groupBy === 'tanker' ? 'Tanker' : ' Driver',
            render: (row) => (
                <div className="flex items-center gap-2">
                    <TrendingUp className="h-4 w-4 text-blue-600" />
                    <span className="font-semibold">{row.groupValue}</span>
                </div>
            ),
        },
        {
            key: 'numberOfRuns',
            header: 'Runs',
            render: (row) => (
                <span className="font-medium text-blue-600">
                    {row.numberOfRuns}
                </span>
            ),
        },
        {
            key: 'totalUpliftLiters',
            header: 'Total Uplift (L)',
            render: (row) => row.totalUpliftLiters.toLocaleString(),
        },
        {
            key: 'totalDeliveredLiters',
            header: 'Total Delivered (L)',
            render: (row) => (
                <span className="font-medium text-green-600">
                    {row.totalDeliveredLiters.toLocaleString()}
                </span>
            ),
        },
        {
            key: 'avgLitersPerRun',
            header: 'Avg per Run (L)',
            render: (row) => (
                <span className="font-mono text-sm">
                    {row.avgLitersPerRun.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                </span>
            ),
        },
        {
            key: 'exceptionCount',
            header: 'Exceptions',
            render: (row) => (
                <span className={row.exceptionCount > 0 ? 'text-red-600 font-semibold' : 'text-gray-400'}>
                    {row.exceptionCount}
                </span>
            ),
        },
    ]

    // Calculate totals
    const totals = data.length > 0 ? {
        groupValue: 'TOTAL',
        numberOfRuns: data.reduce((sum, row) => sum + row.numberOfRuns, 0),
        totalUpliftLiters: data.reduce((sum, row) => sum + row.totalUpliftLiters, 0),
        totalDeliveredLiters: data.reduce((sum, row) => sum + row.totalDeliveredLiters, 0),
        avgLitersPerRun: data.reduce((sum, row) => sum + row.totalDeliveredLiters, 0) / data.reduce((sum, row) => sum + row.numberOfRuns, 0),
        exceptionCount: data.reduce((sum, row) => sum + row.exceptionCount, 0),
    } : undefined

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
                        Productivity Summary
                    </h1>
                    <p className="text-gray-600">
                        Operational KPIs: runs, liters delivered, and efficiency metrics
                    </p>
                </div>

                <div className="bg-white rounded-lg shadow-md p-6 mb-6">
                    <div className="space-y-4">
                        <div className="flex flex-wrap items-end gap-4">
                            <DateRangePicker onDateChange={fetchData} />

                            <div className="flex flex-col gap-1">
                                <label className="text-sm font-medium text-gray-700">Group By</label>
                                <select
                                    value={groupBy}
                                    onChange={(e) => {
                                        const newGroupBy = e.target.value as typeof groupBy
                                        setGroupBy(newGroupBy)
                                        if (dateFrom && dateTo) fetchData(dateFrom, dateTo)
                                    }}
                                    className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                >
                                    <option value="tanker">Tanker</option>
                                    <option value="driver">Driver</option>
                                </select>
                            </div>

                            {data.length > 0 && (
                                <ExportButton onClick={handleExport} filename="productivity" />
                            )}
                        </div>
                    </div>
                </div>

                <ReportTable
                    columns={columns}
                    data={data}
                    loading={loading}
                    showTotals={data.length > 0}
                    totalsRow={totals as any}
                />
            </div>
        </div>
    )
}
