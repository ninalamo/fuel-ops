'use client'

import { useState } from 'react'
import { DateRangePicker } from '@/components/reports/DateRangePicker'
import { ExportButton } from '@/components/reports/ExportButton'
import { ReportTable, Column } from '@/components/reports/ReportTable'
import type { PodCompletenessRow } from '@/lib/types'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'

export default function PodCompletenessPage() {
    const [dateFrom, setDateFrom] = useState('')
    const [dateTo, setDateTo] = useState('')
    const [data, setData] = useState<PodCompletenessRow[]>([])
    const [loading, setLoading] = useState(false)
    const [groupBy, setGroupBy] = useState<'date' | 'station' | 'porter' | 'tanker'>('date')

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
            const response = await fetch(`/api/reports/pod-completeness?${params}`)
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
        const response = await fetch(`/api/reports/pod-completeness?${params}&format=csv`)
        const blob = await response.blob()
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `pod-completeness_${dateFrom}_${dateTo}.csv`
        document.body.appendChild(a)
        a.click()
        window.URL.revokeObjectURL(url)
        document.body.removeChild(a)
    }

    const columns: Column<PodCompletenessRow>[] = [
        {
            key: 'groupValue',
            header: groupBy.charAt(0).toUpperCase() + groupBy.slice(1),
            render: (row) => <span className="font-medium">{row.groupValue}</span>,
        },
        {
            key: 'totalDrops',
            header: 'Total Drops',
            render: (row) => row.totalDrops.toLocaleString(),
        },
        {
            key: 'dropsWithPod',
            header: 'With POD',
            render: (row) => (
                <span className="text-green-600 font-semibold">
                    {row.dropsWithPod.toLocaleString()}
                </span>
            ),
        },
        {
            key: 'dropsMissingPod',
            header: 'Missing POD',
            render: (row) => (
                <span className={row.dropsMissingPod > 0 ? 'text-red-600 font-semibold' : 'text-gray-400'}>
                    {row.dropsMissingPod.toLocaleString()}
                </span>
            ),
        },
        {
            key: 'completenessPercentage',
            header: 'Completeness',
            render: (row) => {
                const percent = row.completenessPercentage
                const color =
                    percent >= 90 ? 'bg-green-500' :
                        percent >= 70 ? 'bg-yellow-500' :
                            'bg-red-500'

                return (
                    <div className="flex items-center gap-2">
                        <div className="flex-1 max-w-32 h-2 bg-gray-200 rounded-full overflow-hidden">
                            <div
                                className={`h-full ${color} transition-all duration-300`}
                                style={{ width: `${percent}%` }}
                            />
                        </div>
                        <span className="text-sm font-semibold min-w-12 text-right">
                            {percent.toFixed(1)}%
                        </span>
                    </div>
                )
            },
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
                        POD Completeness Report
                    </h1>
                    <p className="text-gray-600">
                        Analyze POD attachment rates by date, station, porter, or tanker
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
                                    <option value="date">Date</option>
                                    <option value="station">Station</option>
                                    <option value="porter">Porter</option>
                                    <option value="tanker">Tanker</option>
                                </select>
                            </div>

                            {data.length > 0 && (
                                <ExportButton onClick={handleExport} filename="pod-completeness" />
                            )}
                        </div>
                    </div>
                </div>

                <ReportTable columns={columns} data={data} loading={loading} />
            </div>
        </div>
    )
}
