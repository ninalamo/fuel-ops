import { NextRequest, NextResponse } from 'next/server'
import { format } from 'date-fns'

// Tanker Day mock data matching Figma design
export async function GET(request: NextRequest) {
    try {
        const searchParams = request.nextUrl.searchParams
        const date = searchParams.get('date') || format(new Date(), 'yyyy-MM-dd')

        const tankers = [
            { id: 'tanker-1', plateNumber: 'ABC-1234', capacity: 30000 },
            { id: 'tanker-2', plateNumber: 'XYZ-5678', capacity: 25000 },
            { id: 'tanker-3', plateNumber: 'DEF-9012', capacity: 30000 },
            { id: 'tanker-4', plateNumber: 'GHI-3456', capacity: 20000 },
        ]

        const drivers = ['Juan Cruz', 'Pedro Santos', 'Maria Garcia', 'Jose Reyes']
        const statuses: ('OPEN' | 'SUBMITTED' | 'RETURNED' | 'LOCKED')[] = ['OPEN', 'SUBMITTED', 'LOCKED', 'OPEN']

        const tankerDays = tankers.map((tanker, idx) => {
            const status = statuses[idx]
            const totalTrips = Math.floor(Math.random() * 3) + 2
            const tripsCompleted = status === 'LOCKED'
                ? totalTrips
                : status === 'SUBMITTED'
                    ? totalTrips - 1
                    : Math.floor(Math.random() * totalTrips)

            return {
                id: `td-${date}-${tanker.id}`,
                date,
                tankerId: tanker.id,
                plateNumber: tanker.plateNumber,
                driver: drivers[idx],
                status,
                tripsCompleted,
                totalTrips,
                litersDelivered: tripsCompleted * (5000 + Math.floor(Math.random() * 10000)),
                hasExceptions: Math.random() > 0.7,
            }
        })

        // Calculate stats
        const stats = {
            totalTankers: tankerDays.length,
            open: tankerDays.filter(t => t.status === 'OPEN').length,
            submitted: tankerDays.filter(t => t.status === 'SUBMITTED').length,
            locked: tankerDays.filter(t => t.status === 'LOCKED').length,
        }

        return NextResponse.json({ tankerDays, stats })
    } catch (error) {
        console.error('Error fetching tanker days:', error)
        return NextResponse.json(
            { error: 'Failed to fetch tanker days' },
            { status: 500 }
        )
    }
}
