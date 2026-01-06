export type UserRole =
    | 'MANAGEMENT'
    | 'AUDIT'
    | 'DISPATCHER'
    | 'PORTER'
    | 'SUPERVISOR'
    | 'DRIVER'

export type ProgramStatus =
    | 'DRAFT'
    | 'APPROVED'
    | 'IN_PROGRESS'
    | 'COMPLETED'
    | 'CANCELLED'

export type RunStatus =
    | 'PENDING'
    | 'IN_TRANSIT'
    | 'COMPLETED'
    | 'CANCELLED'

export type ExceptionType =
    | 'VARIANCE'
    | 'MISSING_POD'
    | 'LATE_DELIVERY'
    | 'OTHER'

export type ExceptionSeverity =
    | 'LOW'
    | 'MEDIUM'
    | 'HIGH'
    | 'CRITICAL'

// Report filter types
export interface ReportFilters {
    dateFrom: string // YYYY-MM-DD
    dateTo: string   // YYYY-MM-DD
    tankerId?: string
    stationId?: string
    fuelTypeId?: string
    driverId?: string
    porterId?: string
    status?: ProgramStatus
    varianceOnly?: boolean
    missingPodOnly?: boolean
    type?: ExceptionType
    severity?: ExceptionSeverity
    unclearedOnly?: boolean
    groupBy?: 'date' | 'station' | 'porter' | 'tanker' | 'driver'
}

// Report response types
export interface DailyProgramSummaryRow {
    programId: string
    date: string
    tanker: string
    tankerId: string
    status: ProgramStatus
    plannedLitersByProduct: Record<string, number>
    servedLitersByProduct: Record<string, number>
    pendingLitersByProduct: Record<string, number>
    runsCompleted: number
    exceptionCounts: {
        variance: number
        missingPod: number
        total: number
    }
}

export interface StationLedgerRow {
    date: string
    programId: string
    runId: string
    station: string
    stationId: string
    product: string
    actualLiters: number
    drReference: string | null
    podReference: string | null
    podAttachmentCount: number
}

export interface RunLiquidationRow {
    runId: string
    runNumber: string
    date: string
    tanker: string
    driver: string
    porter: string
    upliftTotalsByProduct: Record<string, number>
    upliftTotalOverall: number
    dropTotalsByProduct: Record<string, number>
    dropTotalOverall: number
    heelTotalsByProduct: Record<string, number>
    heelTotalOverall: number
    expectedHeelOverall: number
    variance: number
    hasVariance: boolean
    missingPodCount: number
    startTime: string | null
    endTime: string | null
}

export interface ExceptionRow {
    id: string
    runId: string | null
    runNumber: string | null
    programId: string | null
    date: string | null
    tanker: string | null
    driver: string | null
    porter: string | null
    type: ExceptionType
    message: string
    severity: ExceptionSeverity
    createdAt: string
    clearedAt: string | null
    clearedBy: string | null
}

export interface PodCompletenessRow {
    groupValue: string  // The grouped value (date, station name, etc.)
    totalDrops: number
    dropsWithPod: number
    dropsMissingPod: number
    completenessPercentage: number
}

export interface ProductivityRow {
    groupValue: string  // tanker or driver name
    numberOfRuns: number
    totalUpliftLiters: number
    totalDeliveredLiters: number
    avgLitersPerRun: number
    exceptionCount: number
}
