import { NextRequest, NextResponse } from 'next/server'
import { MockOperationsService } from '@/lib/services/mock-operations-service'
import { format, subDays } from 'date-fns'

export async function GET(request: NextRequest) {
    try {
        const searchParams = request.nextUrl.searchParams
        const dateFrom = searchParams.get('dateFrom') || format(subDays(new Date(), 7), 'yyyy-MM-dd')
        const dateTo = searchParams.get('dateTo') || format(new Date(), 'yyyy-MM-dd')

        const programs = MockOperationsService.getDailyPrograms(dateFrom, dateTo)

        // Transform for list view
        const result = programs.map(prog => ({
            id: prog.id,
            date: prog.date,
            tankerId: prog.tankerId,
            tanker: prog.tanker,
            status: prog.status,
            totalPlannedLiters: prog.totalPlannedLiters,
            totalServedLiters: prog.totalServedLiters,
            runsCount: prog.runs.length,
        }))

        // Sort by date descending
        result.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())

        return NextResponse.json(result)
    } catch (error) {
        console.error('Error fetching programs:', error)
        return NextResponse.json(
            { error: 'Failed to fetch programs' },
            { status: 500 }
        )
    }
}
