import { NextRequest, NextResponse } from 'next/server'
import { MockOperationsService } from '@/lib/services/mock-operations-service'
import { format, subDays } from 'date-fns'

export async function GET(request: NextRequest) {
    try {
        const dateFrom = format(subDays(new Date(), 7), 'yyyy-MM-dd')
        const dateTo = format(new Date(), 'yyyy-MM-dd')

        const programs = MockOperationsService.getDailyPrograms(dateFrom, dateTo)

        // Flatten all runs from all programs
        const runs = programs.flatMap(prog =>
            prog.runs.map(run => ({
                id: run.id,
                runNumber: run.runNumber,
                date: prog.date,
                tanker: run.tanker.plateNumber,
                driver: run.driver.name,
                porter: run.porter.name,
                status: run.status,
                startTime: run.startTime,
                endTime: run.endTime,
                uplifts: run.uplifts,
                drops: run.drops,
                heels: run.heels,
                exceptions: run.exceptions,
            }))
        )

        // Sort by date descending, then by status (active first)
        runs.sort((a, b) => {
            const dateCompare = new Date(b.date).getTime() - new Date(a.date).getTime()
            if (dateCompare !== 0) return dateCompare

            const statusOrder = { IN_TRANSIT: 0, PENDING: 1, COMPLETED: 2, CANCELLED: 3 }
            return (statusOrder[a.status as keyof typeof statusOrder] || 99) -
                (statusOrder[b.status as keyof typeof statusOrder] || 99)
        })

        return NextResponse.json(runs)
    } catch (error) {
        console.error('Error fetching runs:', error)
        return NextResponse.json(
            { error: 'Failed to fetch runs' },
            { status: 500 }
        )
    }
}
