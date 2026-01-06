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
            groupBy: (searchParams.get('groupBy') as 'date' | 'station' | 'porter' | 'tanker') || 'date',
            stationId: searchParams.get('stationId') || undefined,
            porterId: searchParams.get('porterId') || undefined,
            tankerId: searchParams.get('tankerId') || undefined,
        }

        if (!filters.dateFrom || !filters.dateTo) {
            return NextResponse.json(
                { error: 'dateFrom and dateTo are required' },
                { status: 400 }
            )
        }

        const data = await ReportService.generatePodCompleteness(filters)

        if (format === 'csv') {
            const csv = CsvExporter.convertToCSV(data, {
                groupValue: filters.groupBy || 'date',
                totalDrops: 'Total Drops',
                dropsWithPod: 'Drops with POD',
                dropsMissingPod: 'Drops Missing POD',
                completenessPercentage: 'Completeness %',
            })

            return new NextResponse(csv, {
                headers: CsvExporter.createDownloadHeaders('pod-completeness'),
            })
        }

        return NextResponse.json(data)
    } catch (error) {
        console.error('Error generating POD completeness:', error)
        return NextResponse.json(
            { error: 'Failed to generate report' },
            { status: 500 }
        )
    }
}
