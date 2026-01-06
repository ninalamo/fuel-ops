import { NextRequest, NextResponse } from 'next/server'
import { ReportService } from '@/lib/services/report-service'
import { CsvExporter } from '@/lib/services/csv-exporter'
import type { ReportFilters } from '@/lib/types'

export async function GET(request: NextRequest) {
    try {
        const searchParams = request.nextUrl.searchParams
        const format = request.nextUrl.pathname.endsWith('.csv') ? 'csv' : 'json'

        // Parse filters
        const filters: ReportFilters = {
            dateFrom: searchParams.get('dateFrom') || '',
            dateTo: searchParams.get('dateTo') || '',
            tankerId: searchParams.get('tankerId') || undefined,
            status: searchParams.get('status') as any,
        }

        // Validate required fields
        if (!filters.dateFrom || !filters.dateTo) {
            return NextResponse.json(
                { error: 'dateFrom and dateTo are required' },
                { status: 400 }
            )
        }

        // Generate report
        const data = await ReportService.generateDailyProgramSummary(filters)

        // Return CSV or JSON
        if (format === 'csv') {
            const csv = CsvExporter.convertToCSV(data, {
                date: 'Date',
                tanker: 'Tanker',
                programId: 'Program ID',
                tankerId: 'Tanker ID',
                status: 'Status',
                plannedLitersByProduct: 'Planned Liters (By Product)',
                servedLitersByProduct: 'Served Liters (By Product)',
                pendingLitersByProduct: 'Pending Liters (By Product)',
                runsCompleted: 'Runs Completed',
                exceptionCounts: 'Exception Counts',
            })

            return new NextResponse(csv, {
                headers: CsvExporter.createDownloadHeaders('daily-program-summary'),
            })
        }

        return NextResponse.json(data)
    } catch (error) {
        console.error('Error generating daily program summary:', error)
        return NextResponse.json(
            { error: 'Failed to generate report' },
            { status: 500 }
        )
    }
}
