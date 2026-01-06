'use client'

import { useState } from 'react'
import { DateRangePicker } from '@/components/reports/DateRangePicker'
import { ExportButton } from '@/components/reports/ExportButton'
import { ReportTable, Column } from '@/components/reports/ReportTable'
import type { StationLedgerRow } from '@/lib/types'
import Link from 'next/link'
import { ArrowLeft, AlertCircle } from 'lucide-react'

export default function StationLedgerPage() {
    const [dateFrom, setDateFrom] = useState('')
    const [dateTo, setDateTo] = useState('')
    const [data, setData] = useState<StationLedgerRow[]>([])
    const [loading, setLoading] = useState(false)

    const fetchData = async (from: string, to: string) => {
        setLoading(true)
        setDateFrom(from)
        setDateTo(to)

        try {
            const params = new URLSearchParams({ dateFrom: from, dateTo: to })
            const response = await fetch(`/api/reports/station-ledger?${params}`)
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
        const response = await fetch(`/api/reports/station-ledger?${params}&format=csv`)
        const blob = await response.blob()
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `station-ledger_${dateFrom}_${dateTo}.csv`
        document.body.appendChild(a)
        a.click()
        window.URL.revokeObjectURL(url)
        document.body.removeChild(a)
    }

    const columns: Column<StationLedgerRow>[] = [
        { key: 'date', header: 'Date' },
        {
            key: 'station',
            header: 'Station',
            render: (row) => <span className="font-medium">{row.station}</span>,
        },
        { key: 'product', header: 'Product' },
        {
            key: 'actualLiters',
            header: 'Delivered (L)',
            render: (row) => row.actualLiters.toLocaleString(),
        },
        { key: 'drReference', header: 'DR Reference' },
        { key: 'podReference', header: 'POD Reference' },
        {
            key: 'podAttachmentCount',
            header: 'POD Status',
            render: (row) =>
                row.podAttachmentCount === 0 ? (
                    <div className="flex items-center gap-1 text-red-600">
                        <AlertCircle className="h-4 w-4" />
                        <span className="font-medium">Missing</span>
                    </div>
                ) : (
                    <div className="text-green-600 font-medium">
                        ✓ {row.podAttachmentCount} file{row.podAttachmentCount > 1 ? 's' : ''}
                    </div>
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
                    View Run →
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
                        Station Delivery Ledger
                    </h1>
                    <p className="text-gray-600">
                        Complete delivery history per station with DR/POD tracking
                    </p>
                </div>

                <div className="bg-white rounded-lg shadow-md p-6 mb-6">
                    <div className="flex flex-wrap items-end gap-4">
                        <DateRangePicker onDateChange={fetchData} />
                        {data.length > 0 && (
                            <ExportButton onClick={handleExport} filename="station-ledger" />
                        )}
                    </div>
                </div>

                <ReportTable columns={columns} data={data} loading={loading} />
            </div>
        </div>
    )
}
