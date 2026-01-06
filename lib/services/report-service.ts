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

export class ReportService {
    /**
     * R1: Daily Program Summary
     */
    static async generateDailyProgramSummary(
        filters: ReportFilters,
        userRole?: UserRole,
        userId?: string
    ): Promise<DailyProgramSummaryRow[]> {
        return MockDataService.generateDailyProgramSummary(filters)
    }

    /**
     * R2: Station Delivery Ledger
     */
    static async generateStationLedger(
        filters: ReportFilters
    ): Promise<StationLedgerRow[]> {
        return MockDataService.generateStationLedger(filters)
    }

    /**
     * R3: Dispatch Run Liquidation Report
     */
    static async generateRunLiquidation(
        filters: ReportFilters
    ): Promise<RunLiquidationRow[]> {
        return MockDataService.generateRunLiquidation(filters)
    }

    /**
     * R4: Exceptions Register
     */
    static async generateExceptionsRegister(
        filters: ReportFilters
    ): Promise<ExceptionRow[]> {
        return MockDataService.generateExceptionsRegister(filters)
    }

    /**
     * R5: POD Completeness Report
     */
    static async generatePodCompleteness(
        filters: ReportFilters
    ): Promise<PodCompletenessRow[]> {
        return MockDataService.generatePodCompleteness(filters)
    }

    /**
     * R6: Productivity Summary
     */
    static async generateProductivitySummary(
        filters: ReportFilters
    ): Promise<ProductivityRow[]> {
        return MockDataService.generateProductivitySummary(filters)
    }
}
