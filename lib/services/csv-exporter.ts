/**
 * CSV Exporter Utility
 * Converts JSON data to Excel-friendly CSV format
 */

export class CsvExporter {
    /**
     * Convert JSON data to CSV string
     */
    static convertToCSV<T extends Record<string, any>>(
        data: T[],
        columnMap: Record<keyof T, string> // Maps field names to column headers
    ): string {
        if (data.length === 0) return ''

        const headers = Object.values(columnMap).join(',')
        const fields = Object.keys(columnMap) as (keyof T)[]

        const rows = data.map((row) => {
            return fields.map((field) => {
                let value: any = row[field]

                // Handle different data types
                if (value === null || value === undefined) {
                    return ''
                }

                if (typeof value === 'object') {
                    value = JSON.stringify(value)
                }

                // Escape quotes and wrap in quotes if contains comma, newline, or quote
                const stringValue = String(value)
                if (stringValue.includes(',') || stringValue.includes('\n') || stringValue.includes('"')) {
                    return `"${stringValue.replace(/"/g, '""')}"`
                }

                return stringValue
            }).join(',')
        })

        return [headers, ...rows].join('\n')
    }

    /**
     * Create CSV download response headers
     */
    static createDownloadHeaders(filename: string) {
        const timestamp = new Date().toISOString().split('T')[0]
        const safeFilename = `${filename}_${timestamp}.csv`

        return {
            'Content-Type': 'text/csv; charset=utf-8',
            'Content-Disposition': `attachment; filename="${safeFilename}"`,
        }
    }
}
