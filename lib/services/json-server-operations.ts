import { IOperationsService, TankerDaySummary, DashboardStats } from './operations-interface'
import { TankerDayDetail, TripDetail, Compartment, TimelineEvent } from '@/lib/types'
import { format } from 'date-fns'

export class JsonServerOperationsService implements IOperationsService {
    private baseUrl: string

    constructor() {
        this.baseUrl = process.env.JSON_SERVER_URL || 'http://localhost:3001'
    }

    private async fetchJson<T>(endpoint: string, options?: RequestInit): Promise<T> {
        const url = `${this.baseUrl}${endpoint}`
        console.log('[JsonServer] Fetching:', url)
        const res = await fetch(url, {
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

        // Fetch all trips for the date for dynamic summary calculation
        const allTrips = await this.fetchJson<TripDetail[]>(`/trips?date=${date}`)

        const summaryList: TankerDaySummary[] = allDays.map(d => {
            const dayTrips = allTrips.filter(t => t.tankerDayId === d.id)

            // Calculate dynamic summary
            const tripsCompleted = dayTrips.filter(t => t.status === 'COMPLETED').length
            const totalTrips = dayTrips.length
            const litersDelivered = dayTrips
                .filter(t => t.status === 'COMPLETED')
                .reduce((sum, t) => sum + (t.actualQty || 0), 0)
            const hasExceptions = dayTrips.some(t => (t as any).hasException)

            return {
                id: d.id,
                date: d.date,
                tankerId: d.tankerId,
                plateNumber: d.plateNumber,
                driver: d.driver,
                status: d.status as 'OPEN' | 'SUBMITTED' | 'RETURNED' | 'LOCKED',
                tripsCompleted: tripsCompleted,
                totalTrips: totalTrips,
                litersDelivered: litersDelivered,
                hasExceptions: hasExceptions
            }
        })

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
            if (!days[0]) return null

            // Also fetch trips for this tanker day from the trips collection
            const trips = await this.fetchJson<TripDetail[]>(`/trips?tankerDayId=${id}`)

            // Calculate summary dynamically from trips
            const summary = (trips || []).reduce((acc, t) => ({
                totalPlanned: acc.totalPlanned + (t.plannedQty || 0),
                totalDelivered: acc.totalDelivered + (t.actualQty || 0),
                totalVariance: acc.totalVariance + (t.variance || 0),
                tripsCompleted: acc.tripsCompleted + (t.status === 'COMPLETED' ? 1 : 0),
                totalTrips: acc.totalTrips + 1,
                exceptions: acc.exceptions + ((t as any).hasException ? 1 : 0)
            }), {
                totalPlanned: 0,
                totalDelivered: 0,
                totalVariance: 0,
                tripsCompleted: 0,
                totalTrips: 0,
                exceptions: 0
            })

            return {
                ...days[0],
                trips: trips || [],
                summary
            }
        } catch (error) {
            console.error('Error fetching tanker day:', error)
            return null
        }
    }

    async createTankerDay(date: string, tankerId: string): Promise<TankerDaySummary> {
        // 1. Check existing
        const existing = await this.fetchJson<TankerDayDetail[]>(`/tankerDays?date=${date}&tankerId=${tankerId}`)
        if (existing.length > 0) throw new Error('Tanker Day already exists')

        // 2. Fetch tanker from json-server
        interface TankerRecord {
            id: string
            plateNumber: string
            capacity: number
            compartments: { id: string; name: string; maxVolume: number }[]
        }
        const tankers = await this.fetchJson<TankerRecord[]>(`/tankers?id=${tankerId}`)
        const tanker = tankers[0]
        if (!tanker) throw new Error('Tanker not found')

        const compartments: Compartment[] = tanker.compartments.map((c) => ({
            id: c.id,
            name: c.name,
            maxVolume: c.maxVolume,
            product: '' // Product assigned per trip
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
