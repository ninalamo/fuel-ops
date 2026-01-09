import { NextRequest, NextResponse } from 'next/server'

const JSON_SERVER_URL = process.env.JSON_SERVER_URL || 'http://localhost:3001'

export async function GET(request: NextRequest) {
    try {
        const searchParams = request.nextUrl.searchParams
        const dateFrom = searchParams.get('dateFrom')
        const dateTo = searchParams.get('dateTo')

        // Fetch all trips from json-server
        let url = `${JSON_SERVER_URL}/trips`

        // If date filters are provided, we'll filter client-side since json-server
        // doesn't support complex date range queries easily
        const res = await fetch(url, { cache: 'no-store' })

        if (!res.ok) {
            throw new Error(`JSON Server Error: ${res.status}`)
        }

        let trips = await res.json()

        // Apply date filtering if provided
        if (dateFrom && dateTo) {
            trips = trips.filter((trip: { date: string }) => {
                return trip.date >= dateFrom && trip.date <= dateTo
            })
        } else if (dateFrom) {
            trips = trips.filter((trip: { date: string }) => trip.date >= dateFrom)
        } else if (dateTo) {
            trips = trips.filter((trip: { date: string }) => trip.date <= dateTo)
        }

        // Sort by date descending, then trip number
        trips.sort((a: { date: string; tripNumber: number }, b: { date: string; tripNumber: number }) => {
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

