import { TankerDayDetail, TripDetail, Compartment } from '@/lib/types'

export interface TankerDaySummary {
    id: string
    date: string
    tankerId: string
    plateNumber: string
    driver: string
    status: 'OPEN' | 'SUBMITTED' | 'RETURNED' | 'LOCKED'
    tripsCompleted: number
    totalTrips: number
    litersDelivered: number
    hasExceptions: boolean
}

export interface DashboardStats {
    totalTankers: number
    open: number
    submitted: number
    locked: number
}

export interface CreateTankerDayRequest {
    date: string
    tankerId: string
    // Driver/Porter assigned per trip or defaulted?
    // Current logic: defaulted 
}

export interface IOperationsService {
    getTankerDays(date: string): Promise<{ tankerDays: TankerDaySummary[], stats: DashboardStats }>
    getTankerDay(id: string): Promise<TankerDayDetail | null>
    createTankerDay(date: string, tankerId: string): Promise<TankerDaySummary>
    // createTrip(tankerDayId: string, trip: Partial<TripDetail>): Promise<TripDetail>
    // Other actions...
}
