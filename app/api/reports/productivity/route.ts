import { NextRequest, NextResponse } from 'next/server'
import { ReportService } from '@/lib/services/report-service'
import { CsvExporter } from '@/lib/services/csv-exporter'
import type { ReportFilters } from '@/lib/types'

export async function GET(request: NextRequest) {
    try {
        const searchParams = request.nextUrl.searchParams
        const format = request.nextUrl.pathname.endsWith('.csv') ? 'csv' : 'json'

        const filters: ReportFilters = {
            dateFrom: searchParams.get('dateFrom') || '',
            dateTo: searchParams.get('dateTo') || '',
            groupBy: (searchParams.get('groupBy') as 'tanker' | 'driver') || 'tanker',
            tankerId: searchParams.get('tankerId') || undefined,
            driverId: searchParams.get('driverId') || undefined,
        }

        if (!filters.dateFrom || !filters.dateTo) {
            return NextResponse.json(
                { error: 'dateFrom and dateTo are required' },
                { status: 400 }
            )
        }

        const data = await ReportService.generateProductivitySummary(filters)

        if (format === 'csv') {
            const csv = CsvExporter.convertToCSV(data, {
                groupValue: filters.groupBy || 'tanker',
                numberOfRuns: 'Number of Runs',
                totalUpliftLiters: 'Total Uplift (L)',
                totalDeliveredLiters: 'Total Delivered (L)',
                avgLitersPerRun: 'Avg Liters/Run',
                exceptionCount: 'Exceptions',
            })

            return new NextResponse(csv, {
                headers: CsvExporter.createDownloadHeaders('productivity-summary'),
            })
        }

        return NextResponse.json(data)
    } catch (error) {
        console.error('Error generating productivity summary:', error)
        return NextResponse.json(
            { error: 'Failed to generate report' },
            { status: 500 }
        )
    }
}
