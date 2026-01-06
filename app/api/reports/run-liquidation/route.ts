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
            tankerId: searchParams.get('tankerId') || undefined,
            driverId: searchParams.get('driverId') || undefined,
            porterId: searchParams.get('porterId') || undefined,
            varianceOnly: searchParams.get('varianceOnly') === 'true',
            missingPodOnly: searchParams.get('missingPodOnly') === 'true',
        }

        if (!filters.dateFrom || !filters.dateTo) {
            return NextResponse.json(
                { error: 'dateFrom and dateTo are required' },
                { status: 400 }
            )
        }

        const data = await ReportService.generateRunLiquidation(filters)

        if (format === 'csv') {
            const csv = CsvExporter.convertToCSV(data, {
                runId: 'Run ID',
                runNumber: 'Run Number',
                startTime: 'Start Time',
                endTime: 'End Time',
                date: 'Date',
                tanker: 'Tanker',
                driver: 'Driver',
                porter: 'Porter',
                upliftTotalsByProduct: 'Uplift by Product',
                upliftTotalOverall: 'Total Uplift (L)',
                dropTotalsByProduct: 'Drop by Product',
                dropTotalOverall: 'Total Delivered (L)',
                heelTotalsByProduct: 'Heel by Product',
                heelTotalOverall: 'Total Heel (L)',
                expectedHeelOverall: 'Expected Heel (L)',
                variance: 'Variance (L)',
                hasVariance: 'Has Variance',
                missingPodCount: 'Missing POD Count',
            })

            return new NextResponse(csv, {
                headers: CsvExporter.createDownloadHeaders('run-liquidation'),
            })
        }

        return NextResponse.json(data)
    } catch (error) {
        console.error('Error generating run liquidation:', error)
        return NextResponse.json(
            { error: 'Failed to generate report' },
            { status: 500 }
        )
    }
}
