import { NextRequest, NextResponse } from 'next/server'
import { format, subDays, addDays, eachDayOfInterval } from 'date-fns'

// Generate mock trips data
export async function GET(request: NextRequest) {
    try {
        const searchParams = request.nextUrl.searchParams
        const dateFrom = searchParams.get('dateFrom') || format(new Date(), 'yyyy-MM-dd')
        const dateTo = searchParams.get('dateTo') || format(new Date(), 'yyyy-MM-dd')

        const tankers = [
            { id: 'tanker-1', plateNumber: 'ABC-1234' },
            { id: 'tanker-2', plateNumber: 'XYZ-5678' },
            { id: 'tanker-3', plateNumber: 'DEF-9012' },
            { id: 'tanker-4', plateNumber: 'GHI-3456' },
        ]

        const drivers = ['Juan Cruz', 'Pedro Santos', 'Maria Garcia', 'Jose Reyes']
        const porters = ['Carlos Lopez', 'Ana Mendez', 'Luis Torres', 'Rosa Fernandez']
        const customers = ['Shell Philippines', 'Petron Corporation', 'Caltex Philippines', 'Phoenix Petroleum']
        const stations = ['Shell EDSA', 'Petron Makati', 'Caltex BGC', 'Shell Ortigas', 'Phoenix Alabang']
        const products = ['DIESEL', 'UNLEADED 91', 'UNLEADED 95']
        const statuses: ('PENDING' | 'DEPARTED' | 'DELIVERED' | 'RETURNED')[] = ['PENDING', 'DEPARTED', 'DELIVERED', 'RETURNED']

        const trips: any[] = []

        // Generate trips for each day in range
        const days = eachDayOfInterval({
            start: new Date(dateFrom),
            end: new Date(dateTo),
        })

        days.forEach(day => {
            const dateStr = format(day, 'yyyy-MM-dd')
            const isToday = dateStr === format(new Date(), 'yyyy-MM-dd')
            const isPast = day < new Date()

            // Generate 8-15 trips per day
            const numTrips = Math.floor(Math.random() * 8) + 8

            for (let i = 0; i < numTrips; i++) {
                const tanker = tankers[i % tankers.length]
                const driverIdx = Math.floor(Math.random() * drivers.length)
                const porterIdx = Math.floor(Math.random() * porters.length)
                const customerIdx = Math.floor(Math.random() * customers.length)
                const stationIdx = Math.floor(Math.random() * stations.length)
                const productIdx = Math.floor(Math.random() * products.length)

                // Status based on time
                let status: 'PENDING' | 'DEPARTED' | 'DELIVERED' | 'RETURNED'
                if (isPast && !isToday) {
                    status = Math.random() > 0.1 ? 'DELIVERED' : 'RETURNED'
                } else if (isToday) {
                    const rand = Math.random()
                    if (rand < 0.3) status = 'PENDING'
                    else if (rand < 0.5) status = 'DEPARTED'
                    else if (rand < 0.9) status = 'DELIVERED'
                    else status = 'RETURNED'
                } else {
                    status = 'PENDING'
                }

                const isCompleted = status === 'DELIVERED' || status === 'RETURNED'

                trips.push({
                    id: `trip-${dateStr}-${tanker.id}-${i}`,
                    tankerDayId: `td-${dateStr}-${tanker.id}`,
                    date: dateStr,
                    tripNumber: i + 1,
                    tanker: tanker.plateNumber,
                    driver: drivers[driverIdx],
                    porter: porters[porterIdx],
                    customer: customers[customerIdx],
                    station: stations[stationIdx],
                    product: products[productIdx],
                    quantity: 2000 + Math.floor(Math.random() * 6000),
                    status,
                    departedAt: status !== 'PENDING' ? `${dateStr}T0${6 + Math.floor(i / 3)}:${String(i * 5 % 60).padStart(2, '0')}:00` : null,
                    deliveredAt: isCompleted ? `${dateStr}T${8 + Math.floor(i / 2)}:${String((i * 7) % 60).padStart(2, '0')}:00` : null,
                    hasPod: isCompleted && Math.random() > 0.2,
                    hasException: Math.random() > 0.9,
                })
            }
        })

        // Sort by date descending, then trip number
        trips.sort((a, b) => {
            const dateCompare = new Date(b.date).getTime() - new Date(a.date).getTime()
            if (dateCompare !== 0) return dateCompare
            return a.tripNumber - b.tripNumber
        })

        return NextResponse.json(trips)
    } catch (error) {
        console.error('Error fetching trips:', error)
        return NextResponse.json(
            { error: 'Failed to fetch trips' },
            { status: 500 }
        )
    }
}
