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
            stationId: searchParams.get('stationId') || undefined,
            fuelTypeId: searchParams.get('fuelTypeId') || undefined,
            tankerId: searchParams.get('tankerId') || undefined,
        }

        if (!filters.dateFrom || !filters.dateTo) {
            return NextResponse.json(
                { error: 'dateFrom and dateTo are required' },
                { status: 400 }
            )
        }

        const data = await ReportService.generateStationLedger(filters)

        if (format === 'csv') {
            const csv = CsvExporter.convertToCSV(data, {
                date: 'Date',
                programId: 'Program ID',
                runId: 'Run ID',
                station: 'Station',
                stationId: 'Station ID',
                product: 'Product',
                actualLiters: 'Actual Liters',
                drReference: 'DR Reference',
                podReference: 'POD Reference',
                podAttachmentCount: 'POD Attachments',
            })

            return new NextResponse(csv, {
                headers: CsvExporter.createDownloadHeaders('station-ledger'),
            })
        }

        return NextResponse.json(data)
    } catch (error) {
        console.error('Error generating station ledger:', error)
        return NextResponse.json(
            { error: 'Failed to generate report' },
            { status: 500 }
        )
    }
}
