import { NextRequest, NextResponse } from 'next/server'
import { format, addHours, subHours } from 'date-fns'

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params
        const today = new Date()

        // Generate mock tanker day detail with enhanced trip data
        const data = {
            id,
            date: format(today, 'yyyy-MM-dd'),
            plateNumber: id.includes('tanker-1') ? 'ABC-1234' :
                id.includes('tanker-2') ? 'XYZ-5678' :
                    id.includes('tanker-3') ? 'DEF-9012' : 'GHI-3456',
            driver: 'Juan Cruz',
            porter: 'Carlos Lopez',
            status: 'OPEN',

            // Trips with per-compartment allocation and planned vs actual
            trips: [
                {
                    id: 'trip-1',
                    tripNumber: 1,
                    driver: 'Juan Cruz',
                    porter: 'Carlos Lopez',
                    customer: 'Shell Philippines',
                    station: 'Shell EDSA',
                    product: 'DIESEL',
                    status: 'RETURNED',
                    departedAt: subHours(today, 4).toISOString(),
                    returnedAt: subHours(today, 3).toISOString(),
                    plannedQty: 4500,
                    actualQty: 4300,
                    variance: -200,
                    hasPod: true,
                    compartmentAllocation: [
                        { compartmentId: 'c1', name: 'C1', plannedQty: 2500, actualQty: 2400 },
                        { compartmentId: 'c2', name: 'C2', plannedQty: 2000, actualQty: 1900 },
                    ],
                },
                {
                    id: 'trip-2',
                    tripNumber: 2,
                    driver: 'Juan Cruz',
                    porter: 'Ana Mendez',
                    customer: 'Petron Corporation',
                    station: 'Petron Makati',
                    product: 'UNLEADED 91',
                    status: 'RETURNED',
                    departedAt: subHours(today, 2).toISOString(),
                    returnedAt: subHours(today, 1).toISOString(),
                    plannedQty: 4000,
                    actualQty: 3800,
                    variance: -200,
                    hasPod: true,
                    compartmentAllocation: [
                        { compartmentId: 'c3', name: 'C3', plannedQty: 2000, actualQty: 1900 },
                        { compartmentId: 'c4', name: 'C4', plannedQty: 2000, actualQty: 1900 },
                    ],
                },
                {
                    id: 'trip-3',
                    tripNumber: 3,
                    driver: 'Pedro Santos',
                    porter: 'Carlos Lopez',
                    customer: 'Caltex Philippines',
                    station: 'Caltex BGC',
                    product: 'DIESEL',
                    status: 'PENDING',
                    departedAt: null,
                    returnedAt: null,
                    plannedQty: 5000,
                    actualQty: null,
                    variance: null,
                    hasPod: false,
                    compartmentAllocation: [
                        { compartmentId: 'c1', name: 'C1', plannedQty: 3000, actualQty: null },
                        { compartmentId: 'c2', name: 'C2', plannedQty: 2000, actualQty: null },
                    ],
                },
            ],

            // Timeline events (snapshots, refills, etc.)
            timeline: [
                {
                    id: 'evt-1',
                    type: 'SNAPSHOT' as const,
                    title: 'Opening Snapshot',
                    description: 'Recorded opening fuel levels',
                    details: 'C1: 500L, C2: 800L, C3: 200L, C4: 450L',
                    timestamp: subHours(today, 6).toISOString(),
                    status: 'COMPLETED' as const,
                },
                {
                    id: 'evt-2',
                    type: 'REFILL' as const,
                    title: 'Depot Refill #1',
                    description: 'Loaded 28,000L at Depot Manila',
                    details: 'C1: +7000L, C2: +6700L, C3: +7300L, C4: +7050L',
                    timestamp: subHours(today, 5).toISOString(),
                    status: 'COMPLETED' as const,
                },
                {
                    id: 'evt-3',
                    type: 'TRIP' as const,
                    title: 'Trip #1 - Shell EDSA',
                    description: 'Planned: 4,500L | Actual: 4,300L | Variance: -200L',
                    details: 'C1: -2,400L, C2: -1,900L',
                    timestamp: subHours(today, 3).toISOString(),
                    status: 'COMPLETED' as const,
                },
                {
                    id: 'evt-4',
                    type: 'REFILL' as const,
                    title: 'Depot Refill #2',
                    description: 'Loaded 15,000L at Depot Manila',
                    details: 'C3: +7500L, C4: +7500L',
                    timestamp: subHours(today, 2.5).toISOString(),
                    status: 'COMPLETED' as const,
                },
                {
                    id: 'evt-5',
                    type: 'TRIP' as const,
                    title: 'Trip #2 - Petron Makati',
                    description: 'Planned: 4,000L | Actual: 3,800L | Variance: -200L',
                    details: 'C3: -1,900L, C4: -1,900L',
                    timestamp: subHours(today, 1).toISOString(),
                    status: 'COMPLETED' as const,
                },
                {
                    id: 'evt-6',
                    type: 'TRIP' as const,
                    title: 'Trip #3 - Caltex BGC (Pending)',
                    description: 'Planned: 5,000L Diesel',
                    details: 'C1: 3,000L, C2: 2,000L allocated',
                    timestamp: addHours(today, 1).toISOString(),
                    status: 'PENDING' as const,
                },
            ],

            summary: {
                totalPlanned: 13500,
                totalDelivered: 8100,
                totalVariance: -400,
                tripsCompleted: 2,
                totalTrips: 3,
                exceptions: 0,
            },
        }

        return NextResponse.json(data)
    } catch (error) {
        console.error('Error fetching tanker day detail:', error)
        return NextResponse.json(
            { error: 'Failed to fetch tanker day details' },
            { status: 500 }
        )
    }
}
