'use client'

import Link from 'next/link'
import { ReactNode } from 'react'

export interface Column<T> {
    key: keyof T | string
    header: string
    render?: (row: T) => ReactNode
    className?: string
}

interface ReportTableProps<T> {
    columns: Column<T>[]
    data: T[]
    loading?: boolean
    emptyMessage?: string
    showTotals?: boolean
    totalsRow?: Partial<Record<keyof T, ReactNode>>
}

export function ReportTable<T extends Record<string, any>>({
    columns,
    data,
    loading = false,
    emptyMessage = 'No data available',
    showTotals = false,
    totalsRow,
}: ReportTableProps<T>) {
    if (loading) {
        return (
            <div className="flex items-center justify-center py-12">
                <div className="animate-spin h-8 w-8 border-4 border-blue-600 border-t-transparent rounded-full" />
            </div>
        )
    }

    if (data.length === 0) {
        return (
            <div className="text-center py-12 text-gray-500 bg-gray-50 rounded-lg border border-gray-200">
                {emptyMessage}
            </div>
        )
    }

    return (
        <div className="overflow-x-auto rounded-lg border border-gray-200 shadow-sm">
            <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                    <tr>
                        {columns.map((col) => (
                            <th
                                key={String(col.key)}
                                className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider"
                            >
                                {col.header}
                            </th>
                        ))}
                    </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                    {data.map((row, rowIndex) => (
                        <tr key={rowIndex} className="hover:bg-gray-50 transition-colors">
                            {columns.map((col) => (
                                <td
                                    key={String(col.key)}
                                    className={`px-6 py-4 whitespace-nowrap text-sm text-gray-900 ${col.className || ''}`}
                                >
                                    {col.render ? col.render(row) : String(row[col.key] ?? '-')}
                                </td>
                            ))}
                        </tr>
                    ))}
                    {showTotals && totalsRow && (
                        <tr className="bg-blue-50 font-semibold border-t-2 border-blue-200">
                            {columns.map((col) => (
                                <td
                                    key={String(col.key)}
                                    className="px-6 py-4 whitespace-nowrap text-sm text-gray-900"
                                >
                                    {totalsRow[col.key as keyof T] ?? '-'}
                                </td>
                            ))}
                        </tr>
                    )}
                </tbody>
            </table>
        </div>
    )
}
