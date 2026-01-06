import { format, subHours, addHours } from 'date-fns'
import { IOperationsService, TankerDaySummary, DashboardStats } from './operations-interface'
import { TankerDayDetail, TripDetail, Compartment, TimelineEvent } from '@/lib/types'

// Simple in-memory store for mock persistence across API calls (dev only)
let mockStore: {
    tankerDays: TankerDayDetail[]
} = {
    tankerDays: []
}

const MOCK_TANKERS_DATA = [
    { id: 'tanker-1', plateNumber: 'ABC-1234', capacity: 30000, product: 'DIESEL', compartments: 4 },
    { id: 'tanker-2', plateNumber: 'XYZ-5678', capacity: 25000, product: 'DIESEL', compartments: 3 },
    { id: 'tanker-3', plateNumber: 'DEF-9012', capacity: 30000, product: 'DIESEL', compartments: 2 },
    { id: 'tanker-4', plateNumber: 'GHI-3456', capacity: 20000, product: 'GASOLINE', compartments: 5 },
]

export class MockOperationsService implements IOperationsService {

    async getTankerDays(date: string): Promise<{ tankerDays: TankerDaySummary[]; stats: DashboardStats }> {
        let days = mockStore.tankerDays.filter(d => d.date === date)
        const today = format(new Date(), 'yyyy-MM-dd')
        const isPast = date < today

        if (days.length === 0 && isPast) {
            days = this.generateMockDays(date)
            mockStore.tankerDays.push(...days)
        }

        const summaryList: TankerDaySummary[] = days.map(d => ({
            id: d.id,
            date: d.date,
            tankerId: d.tankerId,
            plateNumber: d.plateNumber,
            driver: d.driver,
            status: d.status as 'OPEN' | 'SUBMITTED' | 'RETURNED' | 'LOCKED',
            tripsCompleted: d.summary.tripsCompleted,
            totalTrips: d.summary.totalTrips,
            litersDelivered: d.summary.totalDelivered,
            hasExceptions: d.summary.exceptions > 0
        }))

        const stats: DashboardStats = {
            totalTankers: summaryList.length,
            open: summaryList.filter(t => t.status === 'OPEN').length,
            submitted: summaryList.filter(t => t.status === 'SUBMITTED').length,
            locked: summaryList.filter(t => t.status === 'LOCKED').length,
        }

        return { tankerDays: summaryList, stats }
    }

    async getTankerDay(id: string): Promise<TankerDayDetail | null> {
        let day = mockStore.tankerDays.find(d => d.id === id)
        if (!day) return null
        return day
    }

    async createTankerDay(date: string, tankerId: string): Promise<TankerDaySummary> {
        const existing = mockStore.tankerDays.find(d => d.date === date && d.tankerId === tankerId)
        if (existing) throw new Error('Tanker Day already exists')

        const tanker = MOCK_TANKERS_DATA.find(t => t.id === tankerId)
        if (!tanker) throw new Error('Tanker not found')

        const compartments: Compartment[] = Array.from({ length: tanker.compartments }).map((_, i) => ({
            id: `comp-${tankerId}-${i + 1}`,
            name: `Comp ${i + 1}`,
            maxVolume: Math.floor(tanker.capacity / tanker.compartments),
            product: tanker.product
        }))

        // Initial snapshot timeline event
        const snapshotEvent: TimelineEvent = {
            id: `evt-snap-${date}-${tankerId}`,
            type: 'SNAPSHOT',
            title: 'Opening Snapshot',
            description: 'Created new tanker day',
            details: 'Initial setup',
            timestamp: new Date().toISOString(),
            status: 'COMPLETED'
        }

        const newDay: TankerDayDetail = {
            id: `td-${date}-${tankerId}`,
            date,
            tankerId,
            plateNumber: tanker.plateNumber,
            driver: '',
            porter: '',
            status: 'OPEN',
            compartments,
            trips: [],
            timeline: [snapshotEvent],
            summary: {
                totalPlanned: 0,
                totalDelivered: 0,
                totalVariance: 0,
                tripsCompleted: 0,
                totalTrips: 0,
                exceptions: 0
            }
        }

        mockStore.tankerDays.push(newDay)

        return {
            id: newDay.id,
            date: newDay.date,
            tankerId: newDay.tankerId,
            plateNumber: newDay.plateNumber,
            driver: '',
            status: 'OPEN',
            tripsCompleted: 0,
            totalTrips: 0,
            litersDelivered: 0,
            hasExceptions: false
        }
    }

    private generateMockDays(date: string): TankerDayDetail[] {
        return MOCK_TANKERS_DATA.map(tanker => {
            const compartments: Compartment[] = Array.from({ length: tanker.compartments }).map((_, i) => ({
                id: `comp-${tanker.id}-${i + 1}`,
                name: `Comp ${i + 1}`,
                maxVolume: Math.floor(tanker.capacity / tanker.compartments),
                product: tanker.product
            }))

            const summary = {
                tripsCompleted: 3,
                totalTrips: 3,
                totalPlanned: 15000,
                totalDelivered: 15000,
                totalVariance: 0,
                exceptions: 0
            }

            // Dummy timeline
            const timeline: TimelineEvent[] = [
                {
                    id: 'evt-1',
                    type: 'SNAPSHOT',
                    title: 'Opening Snapshot',
                    description: 'Recorded fuel levels',
                    timestamp: subHours(new Date(), 8).toISOString(),
                    status: 'COMPLETED'
                }
            ]

            return {
                id: `td-${date}-${tanker.id}`,
                date,
                tankerId: tanker.id,
                plateNumber: tanker.plateNumber,
                driver: 'Mock Driver',
                porter: 'Mock Porter',
                status: 'LOCKED',
                compartments,
                trips: [
                    {
                        tripId: 'trip-mock-1',
                        id: 'trip-mock-1',
                        tripNumber: '1',
                        tankerId: tanker.id,
                        driver: 'Mock Driver',
                        porter: 'Mock Porter',
                        station: 'Shell EDSA',
                        customer: 'Shell',
                        eta: '10:00 AM',
                        status: 'COMPLETED',
                        compartmentAllocation: [],
                        products: [tanker.product],
                        plannedQty: 5000,
                        actualQty: 5000,
                        variance: 0,
                        hasPod: true,
                        podFiles: ['pod-mock-1.jpg'],
                        departedAt: subHours(new Date(), 4).toISOString(),
                        returnedAt: subHours(new Date(), 2).toISOString(),
                    }
                ],
                timeline,
                summary
            }
        })
    }
}
