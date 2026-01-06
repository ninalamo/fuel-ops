import { prisma } from '@/lib/prisma'
import { MockDataService } from '@/lib/services/mock-data-service'
import {
    ReportFilters,
    DailyProgramSummaryRow,
    StationLedgerRow,
    RunLiquidationRow,
    ExceptionRow,
    PodCompletenessRow,
    ProductivityRow,
    UserRole,
} from '@/lib/types'

// Check if we should use mock data
const USE_MOCK_DATA = process.env.USE_MOCK_DATA === 'true' || process.env.NEXT_PUBLIC_USE_MOCK_DATA === 'true'

export class ReportService {
    /**
     * R1: Daily Program Summary
     * Shows per DailyProgram: tanker, date, status, planned/served/pending liters, runs completed, exception counts
     */
    static async generateDailyProgramSummary(
        filters: ReportFilters,
        userRole?: UserRole,
        userId?: string
    ): Promise<DailyProgramSummaryRow[]> {
        // Use mock data if enabled
        if (USE_MOCK_DATA) {
            return MockDataService.generateDailyProgramSummary(filters)
        }
        const programs = await prisma.dailyProgram.findMany({
            where: {
                date: {
                    gte: new Date(filters.dateFrom),
                    lte: new Date(filters.dateTo),
                },
                ...(filters.tankerId && { tankerId: filters.tankerId }),
                ...(filters.status && { status: filters.status }),
            },
            include: {
                tanker: true,
                runs: {
                    include: {
                        uplifts: { include: { fuelType: true } },
                        drops: { include: { fuelType: true, podAttachments: true } },
                        exceptions: true,
                    },
                },
                exceptions: true,
            },
            orderBy: { date: 'desc' },
        })

        return programs.map((program) => {
            const plannedByProduct: Record<string, number> = {}
            const servedByProduct: Record<string, number> = {}

            // Aggregate planned liters from uplifts
            program.runs.forEach((run) => {
                run.uplifts.forEach((uplift) => {
                    const product = uplift.fuelType.code
                    plannedByProduct[product] = (plannedByProduct[product] || 0) + uplift.plannedLiters
                })

                run.drops.forEach((drop) => {
                    const product = drop.fuelType.code
                    servedByProduct[product] = (servedByProduct[product] || 0) + (drop.actualLiters || 0)
                })
            })

            const pendingByProduct: Record<string, number> = {}
            Object.keys(plannedByProduct).forEach((product) => {
                pendingByProduct[product] = plannedByProduct[product] - (servedByProduct[product] || 0)
            })

            // Count exceptions
            const allExceptions = [
                ...program.runs.flatMap((r) => r.exceptions),
                ...program.exceptions,
            ]
            const exceptionCounts = {
                variance: allExceptions.filter((e) => e.type === 'VARIANCE').length,
                missingPod: allExceptions.filter((e) => e.type === 'MISSING_POD').length,
                total: allExceptions.length,
            }

            const runsCompleted = program.runs.filter((r) => r.status === 'COMPLETED').length

            return {
                programId: program.id,
                date: program.date.toISOString().split('T')[0],
                tanker: program.tanker.plateNumber,
                tankerId: program.tankerId,
                status: program.status,
                plannedLitersByProduct: plannedByProduct,
                servedLitersByProduct: servedByProduct,
                pendingLitersByProduct: pendingByProduct,
                runsCompleted,
                exceptionCounts,
            }
        })
    }

    /**
     * R2: Station Delivery Ledger
     * Shows deliveries per station across a date range
     */
    static async generateStationLedger(
        filters: ReportFilters
    ): Promise<StationLedgerRow[]> {
        // Use mock data if enabled
        if (USE_MOCK_DATA) {
            return MockDataService.generateStationLedger(filters)
        }
        const drops = await prisma.drop.findMany({
            where: {
                run: {
                    dailyProgram: {
                        date: {
                            gte: new Date(filters.dateFrom),
                            lte: new Date(filters.dateTo),
                        },
                    },
                    ...(filters.tankerId && { tankerId: filters.tankerId }),
                },
                ...(filters.stationId && { stationId: filters.stationId }),
                ...(filters.fuelTypeId && { fuelTypeId: filters.fuelTypeId }),
            },
            include: {
                run: {
                    include: {
                        dailyProgram: true,
                    },
                },
                station: true,
                fuelType: true,
                podAttachments: true,
            },
            orderBy: [
                { run: { dailyProgram: { date: 'desc' } } },
                { timestamp: 'desc' },
            ],
        })

        return drops.map((drop) => ({
            date: drop.run.dailyProgram.date.toISOString().split('T')[0],
            programId: drop.run.dailyProgramId,
            runId: drop.runId,
            station: drop.station.name,
            stationId: drop.stationId,
            product: drop.fuelType.code,
            actualLiters: drop.actualLiters || 0,
            drReference: drop.drReference,
            podReference: drop.podReference,
            podAttachmentCount: drop.podAttachments.length,
        }))
    }

    /**
   * R3: Dispatch Run Liquidation Report
   * Shows per run: uplift/drop/heel totals, variances, missing PODs
   */
    static async generateRunLiquidation(
        filters: ReportFilters
    ): Promise<RunLiquidationRow[]> {
        // Use mock data if enabled
        if (USE_MOCK_DATA) {
            return MockDataService.generateRunLiquidation(filters)
        }
        const runs = await prisma.dispatchRun.findMany({
            where: {
                dailyProgram: {
                    date: {
                        gte: new Date(filters.dateFrom),
                        lte: new Date(filters.dateTo),
                    },
                },
                ...(filters.tankerId && { tankerId: filters.tankerId }),
                ...(filters.driverId && { driverId: filters.driverId }),
                ...(filters.porterId && { porterId: filters.porterId }),
            },
            include: {
                dailyProgram: true,
                tanker: true,
                driver: true,
                porter: true,
                uplifts: { include: { fuelType: true } },
                drops: { include: { fuelType: true, podAttachments: true } },
                heels: { include: { fuelType: true } },
            },
            orderBy: { createdAt: 'desc' },
        })

        let results = runs.map((run) => {
            // Aggregate uplifts
            const upliftByProduct: Record<string, number> = {}
            let upliftTotal = 0
            run.uplifts.forEach((u) => {
                const actual = u.actualLiters || 0
                upliftByProduct[u.fuelType.code] = (upliftByProduct[u.fuelType.code] || 0) + actual
                upliftTotal += actual
            })

            // Aggregate drops
            const dropByProduct: Record<string, number> = {}
            let dropTotal = 0
            run.drops.forEach((d) => {
                const actual = d.actualLiters || 0
                dropByProduct[d.fuelType.code] = (dropByProduct[d.fuelType.code] || 0) + actual
                dropTotal += actual
            })

            // Aggregate heels
            const heelByProduct: Record<string, number> = {}
            let heelTotal = 0
            let expectedHeelTotal = 0
            run.heels.forEach((h) => {
                const actual = h.actualLiters || 0
                heelByProduct[h.fuelType.code] = (heelByProduct[h.fuelType.code] || 0) + actual
                heelTotal += actual
                expectedHeelTotal += h.expectedLiters || 0
            })

            const variance = heelTotal - expectedHeelTotal
            const hasVariance = Math.abs(variance) > 10 // Threshold: 10 liters

            const missingPodCount = run.drops.filter((d) => d.podAttachments.length === 0).length

            return {
                runId: run.id,
                runNumber: run.runNumber,
                date: run.dailyProgram.date.toISOString().split('T')[0],
                tanker: run.tanker.plateNumber,
                driver: run.driver.name,
                porter: run.porter.name,
                upliftTotalsByProduct: upliftByProduct,
                upliftTotalOverall: upliftTotal,
                dropTotalsByProduct: dropByProduct,
                dropTotalOverall: dropTotal,
                heelTotalsByProduct: heelByProduct,
                heelTotalOverall: heelTotal,
                expectedHeelOverall: expectedHeelTotal,
                variance,
                hasVariance,
                missingPodCount,
                startTime: run.startTime?.toISOString() || null,
                endTime: run.endTime?.toISOString() || null,
            }
        })

        // Apply optional filters
        if (filters.varianceOnly) {
            results = results.filter((r) => r.hasVariance)
        }
        if (filters.missingPodOnly) {
            results = results.filter((r) => r.missingPodCount > 0)
        }

        return results
    }

    /**
   * R4: Exceptions Register
   * Shows all exceptions with filtering
   */
    static async generateExceptionsRegister(
        filters: ReportFilters
    ): Promise<ExceptionRow[]> {
        // Use mock data if enabled
        if (USE_MOCK_DATA) {
            return MockDataService.generateExceptionsRegister(filters)
        }
        const exceptions = await prisma.exception.findMany({
            where: {
                createdAt: {
                    gte: new Date(filters.dateFrom),
                    lte: new Date(filters.dateTo + 'T23:59:59'),
                },
                ...(filters.type && { type: filters.type }),
                ...(filters.severity && { severity: filters.severity }),
                ...(filters.unclearedOnly && { clearedAt: null }),
            },
            include: {
                run: {
                    include: {
                        dailyProgram: true,
                        tanker: true,
                        driver: true,
                        porter: true,
                    },
                },
                program: {
                    include: {
                        tanker: true,
                    },
                },
                clearedBy: true,
            },
            orderBy: { createdAt: 'desc' },
        })

        return exceptions.map((ex) => ({
            id: ex.id,
            runId: ex.runId,
            runNumber: ex.run?.runNumber || null,
            programId: ex.programId,
            date: ex.run?.dailyProgram.date.toISOString().split('T')[0] ||
                ex.program?.date.toISOString().split('T')[0] || null,
            tanker: ex.run?.tanker.plateNumber || ex.program?.tanker.plateNumber || null,
            driver: ex.run?.driver.name || null,
            porter: ex.run?.porter.name || null,
            type: ex.type,
            message: ex.message,
            severity: ex.severity,
            createdAt: ex.createdAt.toISOString(),
            clearedAt: ex.clearedAt?.toISOString() || null,
            clearedBy: ex.clearedBy?.name || null,
        }))
    }

    /**
     * R5: POD Completeness Report
     * Shows POD completion rate grouped by date/station/porter/tanker
     */
    static async generatePodCompleteness(
        filters: ReportFilters
    ): Promise<PodCompletenessRow[]> {
        // Use mock data if enabled
        if (USE_MOCK_DATA) {
            return MockDataService.generatePodCompleteness(filters)
        }

        const groupBy = filters.groupBy || 'date'

        const drops = await prisma.drop.findMany({
            where: {
                run: {
                    dailyProgram: {
                        date: {
                            gte: new Date(filters.dateFrom),
                            lte: new Date(filters.dateTo),
                        },
                    },
                    ...(filters.tankerId && { tankerId: filters.tankerId }),
                    ...(filters.porterId && { porterId: filters.porterId }),
                },
                ...(filters.stationId && { stationId: filters.stationId }),
            },
            include: {
                run: {
                    include: {
                        dailyProgram: true,
                        tanker: true,
                        porter: true,
                    },
                },
                station: true,
                podAttachments: true,
            },
        })

        // Group drops
        const grouped: Record<string, { total: number; withPod: number }> = {}

        drops.forEach((drop) => {
            let key: string
            switch (groupBy) {
                case 'date':
                    key = drop.run.dailyProgram.date.toISOString().split('T')[0]
                    break
                case 'station':
                    key = drop.station.name
                    break
                case 'porter':
                    key = drop.run.porter.name
                    break
                case 'tanker':
                    key = drop.run.tanker.plateNumber
                    break
                default:
                    key = 'Unknown'
            }

            if (!grouped[key]) {
                grouped[key] = { total: 0, withPod: 0 }
            }
            grouped[key].total++
            if (drop.podAttachments.length > 0) {
                grouped[key].withPod++
            }
        })

        return Object.entries(grouped).map(([key, data]) => ({
            groupValue: key,
            totalDrops: data.total,
            dropsWithPod: data.withPod,
            dropsMissingPod: data.total - data.withPod,
            completenessPercentage: data.total > 0 ? (data.withPod / data.total) * 100 : 0,
        }))
    }

    /**
     * R6: Productivity Summary
     * Shows operational KPIs grouped by tanker or driver
     */
    static async generateProductivitySummary(
        filters: ReportFilters
    ): Promise<ProductivityRow[]> {
        // Use mock data if enabled
        if (USE_MOCK_DATA) {
            return MockDataService.generateProductivitySummary(filters)
        }

        const groupBy = filters.groupBy || 'tanker'

        const runs = await prisma.dispatchRun.findMany({
            where: {
                dailyProgram: {
                    date: {
                        gte: new Date(filters.dateFrom),
                        lte: new Date(filters.dateTo),
                    },
                },
                ...(filters.tankerId && { tankerId: filters.tankerId }),
                ...(filters.driverId && { driverId: filters.driverId }),
            },
            include: {
                tanker: true,
                driver: true,
                uplifts: true,
                drops: true,
                exceptions: true,
            },
        })

        // Group runs
        const grouped: Record<string, {
            runs: number
            totalUplift: number
            totalDelivered: number
            exceptions: number
        }> = {}

        runs.forEach((run) => {
            const key = groupBy === 'tanker' ? run.tanker.plateNumber : run.driver.name

            if (!grouped[key]) {
                grouped[key] = { runs: 0, totalUplift: 0, totalDelivered: 0, exceptions: 0 }
            }

            grouped[key].runs++
            grouped[key].totalUplift += run.uplifts.reduce((sum, u) => sum + (u.actualLiters || 0), 0)
            grouped[key].totalDelivered += run.drops.reduce((sum, d) => sum + (d.actualLiters || 0), 0)
            grouped[key].exceptions += run.exceptions.length
        })

        return Object.entries(grouped).map(([key, data]) => ({
            groupValue: key,
            numberOfRuns: data.runs,
            totalUpliftLiters: data.totalUplift,
            totalDeliveredLiters: data.totalDelivered,
            avgLitersPerRun: data.runs > 0 ? data.totalDelivered / data.runs : 0,
            exceptionCount: data.exceptions,
        }))
    }
}
