import { format, subDays, addDays } from 'date-fns'
import type {
    DailyProgramSummaryRow,
    StationLedgerRow,
    RunLiquidationRow,
    ExceptionRow,
    PodCompletenessRow,
    ProductivityRow,
    ReportFilters,
} from '@/lib/types'

/**
 * Mock Data Generator for Development/Testing
 * Use when Supabase is not configured or USE_MOCK_DATA=true
 */
export class MockDataService {
    private static tankers = ['ABC-1234', 'XYZ-5678', 'DEF-9012', 'GHI-3456']
    private static stations = ['Shell EDSA', 'Petron Makati', 'Caltex BGC', 'Shell Ortigas', 'Petron Alabang']
    private static products = ['DIESEL', 'UNLEADED91', 'UNLEADED95', 'PREMIUM97']
    private static drivers = ['Juan Cruz', 'Pedro Santos', 'Maria Garcia', 'Jose Reyes']
    private static porters = ['Carlos Lopez', 'Ana Mendez', 'Luis Torres', 'Rosa Fernandez']

    static generateDailyProgramSummary(filters: ReportFilters): DailyProgramSummaryRow[] {
        const data: DailyProgramSummaryRow[] = []
        const startDate = new Date(filters.dateFrom)
        const endDate = new Date(filters.dateTo)

        let currentDate = startDate
        while (currentDate <= endDate) {
            this.tankers.forEach((tanker, idx) => {
                const plannedByProduct: Record<string, number> = {
                    DIESEL: 15000 + Math.random() * 5000,
                    UNLEADED91: 10000 + Math.random() * 3000,
                }
                const servedByProduct: Record<string, number> = {
                    DIESEL: plannedByProduct.DIESEL * (0.85 + Math.random() * 0.15),
                    UNLEADED91: plannedByProduct.UNLEADED91 * (0.85 + Math.random() * 0.15),
                }
                const pendingByProduct: Record<string, number> = {
                    DIESEL: plannedByProduct.DIESEL - servedByProduct.DIESEL,
                    UNLEADED91: plannedByProduct.UNLEADED91 - servedByProduct.UNLEADED91,
                }

                data.push({
                    programId: `prog-${format(currentDate, 'yyyyMMdd')}-${idx}`,
                    date: format(currentDate, 'yyyy-MM-dd'),
                    tanker,
                    tankerId: `tanker-${idx}`,
                    status: Math.random() > 0.3 ? 'COMPLETED' : 'IN_PROGRESS',
                    plannedLitersByProduct: plannedByProduct,
                    servedLitersByProduct: servedByProduct,
                    pendingLitersByProduct: pendingByProduct,
                    runsCompleted: Math.floor(Math.random() * 5) + 2,
                    exceptionCounts: {
                        variance: Math.random() > 0.7 ? Math.floor(Math.random() * 3) : 0,
                        missingPod: Math.random() > 0.8 ? Math.floor(Math.random() * 2) : 0,
                        total: Math.random() > 0.7 ? Math.floor(Math.random() * 4) : 0,
                    },
                })
            })
            currentDate = addDays(currentDate, 1)
        }

        return data
    }

    static generateStationLedger(filters: ReportFilters): StationLedgerRow[] {
        const data: StationLedgerRow[] = []
        const startDate = new Date(filters.dateFrom)
        const endDate = new Date(filters.dateTo)

        let currentDate = startDate
        while (currentDate <= endDate) {
            this.stations.forEach((station, stIdx) => {
                const numDeliveries = Math.floor(Math.random() * 3) + 1
                for (let i = 0; i < numDeliveries; i++) {
                    data.push({
                        date: format(currentDate, 'yyyy-MM-dd'),
                        programId: `prog-${format(currentDate, 'yyyyMMdd')}-${stIdx}`,
                        runId: `run-${format(currentDate, 'yyyyMMdd')}-${stIdx}-${i}`,
                        station,
                        stationId: `station-${stIdx}`,
                        product: this.products[Math.floor(Math.random() * this.products.length)],
                        actualLiters: Math.floor(Math.random() * 5000) + 2000,
                        drReference: `DR-${format(currentDate, 'yyyyMMdd')}-${Math.floor(Math.random() * 1000)}`,
                        podReference: Math.random() > 0.2 ? `POD-${format(currentDate, 'yyyyMMdd')}-${Math.floor(Math.random() * 1000)}` : null,
                        podAttachmentCount: Math.random() > 0.2 ? Math.floor(Math.random() * 3) + 1 : 0,
                    })
                }
            })
            currentDate = addDays(currentDate, 1)
        }

        return data
    }

    static generateRunLiquidation(filters: ReportFilters): RunLiquidationRow[] {
        const data: RunLiquidationRow[] = []
        const startDate = new Date(filters.dateFrom)
        const endDate = new Date(filters.dateTo)

        let currentDate = startDate
        while (currentDate <= endDate) {
            const numRuns = Math.floor(Math.random() * 4) + 2
            for (let i = 0; i < numRuns; i++) {
                const upliftDiesel = Math.floor(Math.random() * 10000) + 5000
                const upliftUnleaded = Math.floor(Math.random() * 8000) + 4000
                const dropDiesel = upliftDiesel * (0.85 + Math.random() * 0.1)
                const dropUnleaded = upliftUnleaded * (0.85 + Math.random() * 0.1)
                const heelDiesel = upliftDiesel - dropDiesel
                const heelUnleaded = upliftUnleaded - dropUnleaded
                const expectedHeelDiesel = 500 + Math.random() * 200
                const expectedHeelUnleaded = 400 + Math.random() * 150

                const variance = (heelDiesel + heelUnleaded) - (expectedHeelDiesel + expectedHeelUnleaded)

                data.push({
                    runId: `run-${format(currentDate, 'yyyyMMdd')}-${i}`,
                    runNumber: `RUN-${format(currentDate, 'yyyyMMdd')}-${String(i + 1).padStart(3, '0')}`,
                    date: format(currentDate, 'yyyy-MM-dd'),
                    tanker: this.tankers[Math.floor(Math.random() * this.tankers.length)],
                    driver: this.drivers[Math.floor(Math.random() * this.drivers.length)],
                    porter: this.porters[Math.floor(Math.random() * this.porters.length)],
                    upliftTotalsByProduct: { DIESEL: upliftDiesel, UNLEADED91: upliftUnleaded },
                    upliftTotalOverall: upliftDiesel + upliftUnleaded,
                    dropTotalsByProduct: { DIESEL: dropDiesel, UNLEADED91: dropUnleaded },
                    dropTotalOverall: dropDiesel + dropUnleaded,
                    heelTotalsByProduct: { DIESEL: heelDiesel, UNLEADED91: heelUnleaded },
                    heelTotalOverall: heelDiesel + heelUnleaded,
                    expectedHeelOverall: expectedHeelDiesel + expectedHeelUnleaded,
                    variance,
                    hasVariance: Math.abs(variance) > 10,
                    missingPodCount: Math.random() > 0.8 ? Math.floor(Math.random() * 3) : 0,
                    startTime: new Date(currentDate.setHours(6, 0, 0)).toISOString(),
                    endTime: new Date(currentDate.setHours(14, 30, 0)).toISOString(),
                })
            }
            currentDate = addDays(currentDate, 1)
        }

        // Apply filters
        let result = data
        if (filters.varianceOnly) {
            result = result.filter((r) => r.hasVariance)
        }
        if (filters.missingPodOnly) {
            result = result.filter((r) => r.missingPodCount > 0)
        }

        return result
    }

    static generateExceptionsRegister(filters: ReportFilters): ExceptionRow[] {
        const data: ExceptionRow[] = []
        const startDate = new Date(filters.dateFrom)
        const endDate = new Date(filters.dateTo)

        let currentDate = startDate
        while (currentDate <= endDate) {
            // Generate 1-3 exceptions per day
            const numExceptions = Math.floor(Math.random() * 3) + 1
            for (let i = 0; i < numExceptions; i++) {
                const types = ['VARIANCE', 'MISSING_POD', 'LATE_DELIVERY', 'OTHER'] as const
                const severities = ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'] as const
                const type = types[Math.floor(Math.random() * types.length)]
                const severity = severities[Math.floor(Math.random() * severities.length)]
                const isCleared = Math.random() > 0.4

                data.push({
                    id: `exc-${format(currentDate, 'yyyyMMdd')}-${i}`,
                    runId: `run-${format(currentDate, 'yyyyMMdd')}-${i}`,
                    runNumber: `RUN-${format(currentDate, 'yyyyMMdd')}-${String(i + 1).padStart(3, '0')}`,
                    programId: `prog-${format(currentDate, 'yyyyMMdd')}-${i}`,
                    date: format(currentDate, 'yyyy-MM-dd'),
                    tanker: this.tankers[Math.floor(Math.random() * this.tankers.length)],
                    driver: this.drivers[Math.floor(Math.random() * this.drivers.length)],
                    porter: this.porters[Math.floor(Math.random() * this.porters.length)],
                    type,
                    message: this.getExceptionMessage(type),
                    severity,
                    createdAt: new Date(currentDate.setHours(10, 0, 0)).toISOString(),
                    clearedAt: isCleared ? new Date(currentDate.setHours(16, 0, 0)).toISOString() : null,
                    clearedBy: isCleared ? 'Supervisor John Doe' : null,
                })
            }
            currentDate = addDays(currentDate, 1)
        }

        // Apply filters
        let result = data
        if (filters.unclearedOnly) {
            result = result.filter((e) => !e.clearedAt)
        }
        if (filters.type) {
            result = result.filter((e) => e.type === filters.type)
        }
        if (filters.severity) {
            result = result.filter((e) => e.severity === filters.severity)
        }

        return result
    }

    static generatePodCompleteness(filters: ReportFilters): PodCompletenessRow[] {
        const data: PodCompletenessRow[] = []
        const startDate = new Date(filters.dateFrom)
        const endDate = new Date(filters.dateTo)
        const groupBy = filters.groupBy || 'date'

        const groups = groupBy === 'date'
            ? this.getDateRange(startDate, endDate)
            : groupBy === 'station'
                ? this.stations
                : groupBy === 'porter'
                    ? this.porters
                    : this.tankers

        groups.forEach((group) => {
            const totalDrops = Math.floor(Math.random() * 50) + 20
            const dropsWithPod = Math.floor(totalDrops * (0.7 + Math.random() * 0.25))

            data.push({
                groupValue: typeof group === 'string' ? group : format(group, 'yyyy-MM-dd'),
                totalDrops,
                dropsWithPod,
                dropsMissingPod: totalDrops - dropsWithPod,
                completenessPercentage: (dropsWithPod / totalDrops) * 100,
            })
        })

        return data
    }

    static generateProductivitySummary(filters: ReportFilters): ProductivityRow[] {
        const data: ProductivityRow[] = []
        const groupBy = filters.groupBy || 'tanker'
        const groups = groupBy === 'tanker' ? this.tankers : this.drivers

        groups.forEach((group) => {
            const numberOfRuns = Math.floor(Math.random() * 20) + 10
            const totalUpliftLiters = numberOfRuns * (12000 + Math.random() * 5000)
            const totalDeliveredLiters = totalUpliftLiters * (0.9 + Math.random() * 0.08)

            data.push({
                groupValue: group,
                numberOfRuns,
                totalUpliftLiters: Math.floor(totalUpliftLiters),
                totalDeliveredLiters: Math.floor(totalDeliveredLiters),
                avgLitersPerRun: totalDeliveredLiters / numberOfRuns,
                exceptionCount: Math.floor(Math.random() * 5),
            })
        })

        return data
    }

    private static getExceptionMessage(type: string): string {
        const messages = {
            VARIANCE: 'Heel variance exceeds acceptable threshold of ±10L',
            MISSING_POD: 'Proof of Delivery document not uploaded within required timeframe',
            LATE_DELIVERY: 'Delivery completed 2 hours past scheduled time',
            OTHER: 'Unusual activity detected during dispatch run',
        }
        return messages[type as keyof typeof messages] || 'Exception detected'
    }

    private static getDateRange(start: Date, end: Date): Date[] {
        const dates: Date[] = []
        let current = start
        while (current <= end) {
            dates.push(new Date(current))
            current = addDays(current, 1)
        }
        return dates
    }
}
