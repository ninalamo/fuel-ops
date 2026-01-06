import { format, subDays, addDays, addHours } from 'date-fns'
import type {
    ProgramStatus,
    RunStatus,
    ExceptionType,
    ExceptionSeverity,
} from '@/lib/types'

// Extended types for operations
export interface DailyProgramFull {
    id: string
    date: string
    tankerId: string
    tanker: {
        id: string
        plateNumber: string
        capacity: number
    }
    status: ProgramStatus
    createdBy: string
    createdAt: string
    runs: DispatchRunFull[]
    totalPlannedLiters: number
    totalServedLiters: number
}

export interface DispatchRunFull {
    id: string
    runNumber: string
    dailyProgramId: string
    tankerId: string
    tanker: { plateNumber: string }
    driverId: string
    driver: { id: string; name: string }
    porterId: string
    porter: { id: string; name: string }
    status: RunStatus
    startTime: string | null
    endTime: string | null
    uplifts: UpliftRecord[]
    drops: DropRecord[]
    heels: HeelRecord[]
    exceptions: ExceptionRecord[]
}

export interface UpliftRecord {
    id: string
    fuelType: string
    plannedLiters: number
    actualLiters: number | null
    depot: string
    timestamp: string | null
}

export interface DropRecord {
    id: string
    stationId: string
    station: string
    fuelType: string
    sequenceNo: number
    plannedLiters: number
    actualLiters: number | null
    drReference: string | null
    podReference: string | null
    podAttachmentCount: number
    timestamp: string | null
}

export interface HeelRecord {
    id: string
    fuelType: string
    actualLiters: number
    expectedLiters: number | null
    variance: number | null
}

export interface ExceptionRecord {
    id: string
    type: ExceptionType
    severity: ExceptionSeverity
    message: string
    createdAt: string
    clearedAt: string | null
    clearedBy: string | null
}

export interface DashboardStats {
    todayPrograms: number
    activeRuns: number
    completedRuns: number
    pendingDeliveries: number
    missingPods: number
    openExceptions: number
    totalLitersDelivered: number
    tankerUtilization: number
}

export interface TankerStatus {
    id: string
    plateNumber: string
    capacity: number
    status: 'AVAILABLE' | 'IN_TRANSIT' | 'LOADING' | 'MAINTENANCE'
    currentRun: string | null
    driver: string | null
    currentLocation: string | null
    lastUpdate: string
}

/**
 * Mock Operations Data Service
 * Provides realistic data for the operations dashboard and tracking UI
 */
export class MockOperationsService {
    private static tankers = [
        { id: 'tanker-1', plateNumber: 'ABC-1234', capacity: 30000 },
        { id: 'tanker-2', plateNumber: 'XYZ-5678', capacity: 25000 },
        { id: 'tanker-3', plateNumber: 'DEF-9012', capacity: 30000 },
        { id: 'tanker-4', plateNumber: 'GHI-3456', capacity: 20000 },
    ]

    private static stations = [
        { id: 'station-1', code: 'SHELL-EDSA', name: 'Shell EDSA' },
        { id: 'station-2', code: 'PETRON-MKT', name: 'Petron Makati' },
        { id: 'station-3', code: 'CALTEX-BGC', name: 'Caltex BGC' },
        { id: 'station-4', code: 'SHELL-ORT', name: 'Shell Ortigas' },
        { id: 'station-5', code: 'PETRON-ALB', name: 'Petron Alabang' },
    ]

    private static drivers = [
        { id: 'driver-1', name: 'Juan Cruz' },
        { id: 'driver-2', name: 'Pedro Santos' },
        { id: 'driver-3', name: 'Maria Garcia' },
        { id: 'driver-4', name: 'Jose Reyes' },
    ]

    private static porters = [
        { id: 'porter-1', name: 'Carlos Lopez' },
        { id: 'porter-2', name: 'Ana Mendez' },
        { id: 'porter-3', name: 'Luis Torres' },
        { id: 'porter-4', name: 'Rosa Fernandez' },
    ]

    private static fuelTypes = ['DIESEL', 'UNLEADED91', 'UNLEADED95']

    // Dashboard Stats
    static getDashboardStats(): DashboardStats {
        return {
            todayPrograms: 4,
            activeRuns: 3,
            completedRuns: 5,
            pendingDeliveries: 12,
            missingPods: 4,
            openExceptions: 2,
            totalLitersDelivered: 156000,
            tankerUtilization: 75,
        }
    }

    // Tanker Status for Live Monitoring
    static getTankerStatuses(): TankerStatus[] {
        const statuses: ('AVAILABLE' | 'IN_TRANSIT' | 'LOADING' | 'MAINTENANCE')[] =
            ['IN_TRANSIT', 'LOADING', 'IN_TRANSIT', 'AVAILABLE']

        return this.tankers.map((tanker, idx) => ({
            id: tanker.id,
            plateNumber: tanker.plateNumber,
            capacity: tanker.capacity,
            status: statuses[idx],
            currentRun: statuses[idx] !== 'AVAILABLE' ? `RUN-${format(new Date(), 'yyyyMMdd')}-${String(idx + 1).padStart(3, '0')}` : null,
            driver: statuses[idx] !== 'AVAILABLE' ? this.drivers[idx].name : null,
            currentLocation: statuses[idx] === 'IN_TRANSIT' ? this.stations[idx].name : statuses[idx] === 'LOADING' ? 'Depot Manila' : null,
            lastUpdate: new Date().toISOString(),
        }))
    }

    // Get Active Runs (In Transit or Pending)
    static getActiveRuns(): DispatchRunFull[] {
        const today = new Date()
        const runs: DispatchRunFull[] = []

        // Generate 3 active runs
        for (let i = 0; i < 3; i++) {
            const tanker = this.tankers[i]
            const driver = this.drivers[i]
            const porter = this.porters[i]
            const status: RunStatus = i === 0 ? 'IN_TRANSIT' : i === 1 ? 'PENDING' : 'IN_TRANSIT'

            runs.push({
                id: `run-active-${i}`,
                runNumber: `RUN-${format(today, 'yyyyMMdd')}-${String(i + 1).padStart(3, '0')}`,
                dailyProgramId: `prog-${format(today, 'yyyyMMdd')}-${i}`,
                tankerId: tanker.id,
                tanker: { plateNumber: tanker.plateNumber },
                driverId: driver.id,
                driver: driver,
                porterId: porter.id,
                porter: porter,
                status,
                startTime: status !== 'PENDING' ? addHours(today, -2).toISOString() : null,
                endTime: null,
                uplifts: this.generateUplifts(),
                drops: this.generateDrops(status === 'IN_TRANSIT' ? 2 : 0, 4),
                heels: [],
                exceptions: [],
            })
        }

        return runs
    }

    // Get Today's Programs
    static getTodayPrograms(): DailyProgramFull[] {
        const today = format(new Date(), 'yyyy-MM-dd')
        return this.getDailyPrograms(today, today)
    }

    // Get Daily Programs for a date range
    static getDailyPrograms(dateFrom: string, dateTo: string): DailyProgramFull[] {
        const programs: DailyProgramFull[] = []
        let currentDate = new Date(dateFrom)
        const endDate = new Date(dateTo)

        while (currentDate <= endDate) {
            // 2-4 programs per day
            const numPrograms = Math.floor(Math.random() * 3) + 2

            for (let i = 0; i < numPrograms && i < this.tankers.length; i++) {
                const tanker = this.tankers[i]
                const runs = this.generateRunsForProgram(currentDate, tanker, i)

                const totalPlanned = runs.reduce((sum, r) =>
                    sum + r.uplifts.reduce((s, u) => s + u.plannedLiters, 0), 0)
                const totalServed = runs.reduce((sum, r) =>
                    sum + r.drops.reduce((s, d) => s + (d.actualLiters || 0), 0), 0)

                programs.push({
                    id: `prog-${format(currentDate, 'yyyyMMdd')}-${i}`,
                    date: format(currentDate, 'yyyy-MM-dd'),
                    tankerId: tanker.id,
                    tanker: tanker,
                    status: this.getRandomProgramStatus(currentDate),
                    createdBy: 'Dispatcher Admin',
                    createdAt: addDays(currentDate, -1).toISOString(),
                    runs,
                    totalPlannedLiters: totalPlanned,
                    totalServedLiters: totalServed,
                })
            }

            currentDate = addDays(currentDate, 1)
        }

        return programs
    }

    // Get specific program by ID
    static getProgramById(id: string): DailyProgramFull | null {
        const programs = this.getDailyPrograms(
            format(subDays(new Date(), 7), 'yyyy-MM-dd'),
            format(new Date(), 'yyyy-MM-dd')
        )
        return programs.find(p => p.id === id) || null
    }

    // Get specific run by ID
    static getRunById(id: string): DispatchRunFull | null {
        const programs = this.getDailyPrograms(
            format(subDays(new Date(), 7), 'yyyy-MM-dd'),
            format(new Date(), 'yyyy-MM-dd')
        )
        for (const prog of programs) {
            const run = prog.runs.find(r => r.id === id)
            if (run) return run
        }
        return null
    }

    // Get master data
    static getTankers() { return this.tankers }
    static getStations() { return this.stations }
    static getDrivers() { return this.drivers }
    static getPorters() { return this.porters }
    static getFuelTypes() { return this.fuelTypes.map((code, i) => ({ id: `fuel-${i}`, code, name: code })) }

    // Private helpers
    private static generateRunsForProgram(date: Date, tanker: typeof this.tankers[0], progIdx: number): DispatchRunFull[] {
        const runs: DispatchRunFull[] = []
        const numRuns = Math.floor(Math.random() * 3) + 1

        for (let i = 0; i < numRuns; i++) {
            const driver = this.drivers[(progIdx + i) % this.drivers.length]
            const porter = this.porters[(progIdx + i) % this.porters.length]
            const status = this.getRandomRunStatus(date)
            const completedDrops = status === 'COMPLETED' ? 3 : status === 'IN_TRANSIT' ? 1 : 0

            runs.push({
                id: `run-${format(date, 'yyyyMMdd')}-${progIdx}-${i}`,
                runNumber: `RUN-${format(date, 'yyyyMMdd')}-${String(progIdx * 3 + i + 1).padStart(3, '0')}`,
                dailyProgramId: `prog-${format(date, 'yyyyMMdd')}-${progIdx}`,
                tankerId: tanker.id,
                tanker: { plateNumber: tanker.plateNumber },
                driverId: driver.id,
                driver: driver,
                porterId: porter.id,
                porter: porter,
                status,
                startTime: status !== 'PENDING' ? addHours(date, 6 + i * 4).toISOString() : null,
                endTime: status === 'COMPLETED' ? addHours(date, 10 + i * 4).toISOString() : null,
                uplifts: this.generateUplifts(),
                drops: this.generateDrops(completedDrops, 3),
                heels: status === 'COMPLETED' ? this.generateHeels() : [],
                exceptions: Math.random() > 0.7 ? [this.generateException(date)] : [],
            })
        }

        return runs
    }

    private static generateUplifts(): UpliftRecord[] {
        return [
            {
                id: `uplift-${Math.random().toString(36).substr(2, 9)}`,
                fuelType: 'DIESEL',
                plannedLiters: 15000,
                actualLiters: 14800 + Math.floor(Math.random() * 400),
                depot: 'Depot Manila',
                timestamp: new Date().toISOString(),
            },
            {
                id: `uplift-${Math.random().toString(36).substr(2, 9)}`,
                fuelType: 'UNLEADED91',
                plannedLiters: 10000,
                actualLiters: 9800 + Math.floor(Math.random() * 400),
                depot: 'Depot Manila',
                timestamp: new Date().toISOString(),
            },
        ]
    }

    private static generateDrops(completedCount: number, total: number): DropRecord[] {
        const drops: DropRecord[] = []

        for (let i = 0; i < total; i++) {
            const station = this.stations[i % this.stations.length]
            const isCompleted = i < completedCount
            const plannedLiters = 3000 + Math.floor(Math.random() * 2000)

            drops.push({
                id: `drop-${Math.random().toString(36).substr(2, 9)}`,
                stationId: station.id,
                station: station.name,
                fuelType: i % 2 === 0 ? 'DIESEL' : 'UNLEADED91',
                sequenceNo: i + 1,
                plannedLiters,
                actualLiters: isCompleted ? plannedLiters - Math.floor(Math.random() * 50) : null,
                drReference: isCompleted ? `DR-${Date.now()}-${i}` : null,
                podReference: isCompleted && Math.random() > 0.2 ? `POD-${Date.now()}-${i}` : null,
                podAttachmentCount: isCompleted && Math.random() > 0.2 ? Math.floor(Math.random() * 2) + 1 : 0,
                timestamp: isCompleted ? new Date().toISOString() : null,
            })
        }

        return drops
    }

    private static generateHeels(): HeelRecord[] {
        return [
            {
                id: `heel-${Math.random().toString(36).substr(2, 9)}`,
                fuelType: 'DIESEL',
                actualLiters: 450 + Math.floor(Math.random() * 100),
                expectedLiters: 500,
                variance: Math.floor(Math.random() * 60) - 30,
            },
            {
                id: `heel-${Math.random().toString(36).substr(2, 9)}`,
                fuelType: 'UNLEADED91',
                actualLiters: 350 + Math.floor(Math.random() * 80),
                expectedLiters: 400,
                variance: Math.floor(Math.random() * 50) - 25,
            },
        ]
    }

    private static generateException(date: Date): ExceptionRecord {
        const types: ExceptionType[] = ['VARIANCE', 'MISSING_POD']
        const severities: ExceptionSeverity[] = ['LOW', 'MEDIUM', 'HIGH']
        const type = types[Math.floor(Math.random() * types.length)]

        return {
            id: `exc-${Math.random().toString(36).substr(2, 9)}`,
            type,
            severity: severities[Math.floor(Math.random() * severities.length)],
            message: type === 'VARIANCE' ? 'Heel variance exceeds threshold' : 'POD not uploaded within required timeframe',
            createdAt: date.toISOString(),
            clearedAt: null,
            clearedBy: null,
        }
    }

    private static getRandomProgramStatus(date: Date): ProgramStatus {
        const today = new Date()
        today.setHours(0, 0, 0, 0)
        const targetDate = new Date(date)
        targetDate.setHours(0, 0, 0, 0)

        if (targetDate < today) return 'COMPLETED'
        if (targetDate.getTime() === today.getTime()) {
            const rand = Math.random()
            if (rand < 0.3) return 'COMPLETED'
            if (rand < 0.7) return 'IN_PROGRESS'
            return 'APPROVED'
        }
        return Math.random() > 0.5 ? 'APPROVED' : 'DRAFT'
    }

    private static getRandomRunStatus(date: Date): RunStatus {
        const today = new Date()
        today.setHours(0, 0, 0, 0)
        const targetDate = new Date(date)
        targetDate.setHours(0, 0, 0, 0)

        if (targetDate < today) return 'COMPLETED'
        if (targetDate.getTime() === today.getTime()) {
            const rand = Math.random()
            if (rand < 0.4) return 'COMPLETED'
            if (rand < 0.7) return 'IN_TRANSIT'
            return 'PENDING'
        }
        return 'PENDING'
    }
}
