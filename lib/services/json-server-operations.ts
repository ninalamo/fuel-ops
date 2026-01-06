import { IOperationsService, TankerDaySummary, DashboardStats } from './operations-interface'
import { TankerDayDetail, TripDetail, Compartment, TimelineEvent } from '@/lib/types'
import { format } from 'date-fns'

export class JsonServerOperationsService implements IOperationsService {
    private baseUrl: string

    constructor() {
        this.baseUrl = process.env.JSON_SERVER_URL || 'http://localhost:3001'
    }

    private async fetchJson<T>(endpoint: string, options?: RequestInit): Promise<T> {
        const res = await fetch(`${this.baseUrl}${endpoint}`, {
            cache: 'no-store',
            ...options
        })
        if (!res.ok) {
            throw new Error(`JSON Server Error: ${res.status} ${res.statusText}`)
        }
        return res.json()
    }

    async getTankerDays(date: string): Promise<{ tankerDays: TankerDaySummary[]; stats: DashboardStats }> {
        // Fetch all and filter client-side for simplicity, or use query param if supported
        const allDays = await this.fetchJson<TankerDayDetail[]>(`/tankerDays?date=${date}`)

        const summaryList: TankerDaySummary[] = allDays.map(d => ({
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

        // Mock stats because JSON server doesn't aggregate
        // In a real app we'd fetch all days to calc stats, or just stats for today
        const stats: DashboardStats = {
            totalTankers: summaryList.length,
            open: summaryList.filter(t => t.status === 'OPEN').length,
            submitted: summaryList.filter(t => t.status === 'SUBMITTED').length,
            locked: summaryList.filter(t => t.status === 'LOCKED').length,
        }

        return { tankerDays: summaryList, stats }
    }

    async getTankerDay(id: string): Promise<TankerDayDetail | null> {
        try {
            const days = await this.fetchJson<TankerDayDetail[]>(`/tankerDays?id=${id}`)
            return days[0] || null
        } catch (error) {
            console.error('Error fetching tanker day:', error)
            return null
        }
    }

    async createTankerDay(date: string, tankerId: string): Promise<TankerDaySummary> {
        // 1. Check existing
        const existing = await this.fetchJson<TankerDayDetail[]>(`/tankerDays?date=${date}&tankerId=${tankerId}`)
        if (existing.length > 0) throw new Error('Tanker Day already exists')

        // 2. Prepare new data (Similar to Mock)
        // Hardcoded "Lookup" since we don't have a Tankers table in db.json yet
        // In real impl, we'd fetch from /tankers
        const MOCK_TANKERS_DATA = [
            { id: 'tanker-1', plateNumber: 'ABC-1234', capacity: 30000, product: 'DIESEL', compartments: 4 },
            { id: 'tanker-2', plateNumber: 'XYZ-5678', capacity: 25000, product: 'DIESEL', compartments: 3 },
            { id: 'tanker-3', plateNumber: 'DEF-9012', capacity: 30000, product: 'DIESEL', compartments: 2 },
            { id: 'tanker-4', plateNumber: 'GHI-3456', capacity: 20000, product: 'GASOLINE', compartments: 5 },
        ]
        const tanker = MOCK_TANKERS_DATA.find(t => t.id === tankerId)
        if (!tanker) throw new Error('Tanker not found')

        const compartments: Compartment[] = Array.from({ length: tanker.compartments }).map((_, i) => ({
            id: `comp-${tankerId}-${i + 1}`,
            name: `Comp ${i + 1}`,
            maxVolume: Math.floor(tanker.capacity / tanker.compartments),
            product: tanker.product
        }))

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
            timeline: [],
            summary: {
                totalPlanned: 0,
                totalDelivered: 0,
                totalVariance: 0,
                tripsCompleted: 0,
                totalTrips: 0,
                exceptions: 0
            }
        }

        await this.fetchJson('/tankerDays', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(newDay)
        })

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
}
