'use client'

import { useState } from 'react'
import { format } from 'date-fns'

interface DateRangePickerProps {
    onDateChange: (from: string, to: string) => void
    defaultDaysBack?: number
}

export function DateRangePicker({ onDateChange, defaultDaysBack = 7 }: DateRangePickerProps) {
    const defaultTo = format(new Date(), 'yyyy-MM-dd')
    const defaultFrom = format(
        new Date(Date.now() - defaultDaysBack * 24 * 60 * 60 * 1000),
        'yyyy-MM-dd'
    )

    const [dateFrom, setDateFrom] = useState(defaultFrom)
    const [dateTo, setDateTo] = useState(defaultTo)

    const handleFromChange = (value: string) => {
        setDateFrom(value)
        onDateChange(value, dateTo)
    }

    const handleToChange = (value: string) => {
        setDateTo(value)
        onDateChange(dateFrom, value)
    }

    return (
        <div className="flex gap-4 items-center">
            <div className="flex flex-col gap-1">
                <label className="text-sm font-medium text-gray-700">From</label>
                <input
                    type="date"
                    value={dateFrom}
                    onChange={(e) => handleFromChange(e.target.value)}
                    className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
            </div>
            <div className="flex flex-col gap-1">
                <label className="text-sm font-medium text-gray-700">To</label>
                <input
                    type="date"
                    value={dateTo}
                    onChange={(e) => handleToChange(e.target.value)}
                    className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
            </div>
        </div>
    )
}
