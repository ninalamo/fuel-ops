import { NextRequest, NextResponse } from 'next/server'
import { ReportService } from '@/lib/services/report-service'
import { CsvExporter } from '@/lib/services/csv-exporter'
import type { ReportFilters, ExceptionType, ExceptionSeverity } from '@/lib/types'

export async function GET(request: NextRequest) {
    try {
        const searchParams = request.nextUrl.searchParams
        const format = request.nextUrl.pathname.endsWith('.csv') ? 'csv' : 'json'

        const filters: ReportFilters = {
            dateFrom: searchParams.get('dateFrom') || '',
            dateTo: searchParams.get('dateTo') || '',
            type: searchParams.get('type') as ExceptionType | undefined,
            severity: searchParams.get('severity') as ExceptionSeverity | undefined,
            unclearedOnly: searchParams.get('unclearedOnly') === 'true',
        }

        if (!filters.dateFrom || !filters.dateTo) {
            return NextResponse.json(
                { error: 'dateFrom and dateTo are required' },
                { status: 400 }
            )
        }

        const data = await ReportService.generateExceptionsRegister(filters)

        if (format === 'csv') {
            const csv = CsvExporter.convertToCSV(data, {
                runNumber: 'Run Number',
                date: 'Date',
                tanker: 'Tanker',
                driver: 'Driver',
                porter: 'Porter',
                type: 'Exception Type',
                severity: 'Severity',
                message: 'Message',
                createdAt: 'Created At',
                clearedAt: 'Cleared At',
                clearedBy: 'Cleared By',
            })

            return new NextResponse(csv, {
                headers: CsvExporter.createDownloadHeaders('exceptions-register'),
            })
        }

        return NextResponse.json(data)
    } catch (error) {
        console.error('Error generating exceptions register:', error)
        return NextResponse.json(
            { error: 'Failed to generate report' },
            { status: 500 }
        )
    }
}
