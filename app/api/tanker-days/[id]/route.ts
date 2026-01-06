import { NextRequest, NextResponse } from 'next/server'
import { format, addHours, subHours } from 'date-fns'

// Mock tanker configurations (data-driven compartments)
const TANKER_CONFIGS: Record<string, { plateNumber: string; compartments: Array<{ id: string; name: string; maxVolume: number; product: string }> }> = {
    'tanker-1': {
        plateNumber: 'ABC-1234',
        compartments: [
            { id: 'c1', name: 'C1', maxVolume: 7500, product: 'DIESEL' },
            { id: 'c2', name: 'C2', maxVolume: 7500, product: 'DIESEL' },
            { id: 'c3', name: 'C3', maxVolume: 7500, product: 'UNLEADED' },
            { id: 'c4', name: 'C4', maxVolume: 7500, product: 'UNLEADED' },
        ],
    },
    'tanker-2': {
        plateNumber: 'XYZ-5678',
        compartments: [
            { id: 'c1', name: 'C1', maxVolume: 8500, product: 'DIESEL' },
            { id: 'c2', name: 'C2', maxVolume: 8500, product: 'DIESEL' },
            { id: 'c3', name: 'C3', maxVolume: 8000, product: 'UNLEADED' },
        ],
    },
    'tanker-3': {
        plateNumber: 'DEF-9012',
        compartments: [
            { id: 'c1', name: 'C1', maxVolume: 10000, product: 'DIESEL' },
            { id: 'c2', name: 'C2', maxVolume: 10000, product: 'DIESEL' },
        ],
    },
    'tanker-4': {
        plateNumber: 'GHI-3456',
        compartments: [
            { id: 'c1', name: 'C1', maxVolume: 7000, product: 'DIESEL' },
            { id: 'c2', name: 'C2', maxVolume: 7000, product: 'DIESEL' },
            { id: 'c3', name: 'C3', maxVolume: 7000, product: 'UNLEADED' },
            { id: 'c4', name: 'C4', maxVolume: 7000, product: 'UNLEADED' },
            { id: 'c5', name: 'C5', maxVolume: 7000, product: 'PREMIUM' },
        ],
    },
}

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params
        const today = new Date()

        // Extract tanker id from the tanker day id (e.g., "td-2026-01-06-tanker-1" -> "tanker-1")
        const tankerIdMatch = id.match(/tanker-\d+/)
        const tankerId = tankerIdMatch ? tankerIdMatch[0] : 'tanker-1'
        const tankerConfig = TANKER_CONFIGS[tankerId] || TANKER_CONFIGS['tanker-1']

        // Generate mock tanker day detail with data-driven compartments
        const data = {
            id,
            date: format(today, 'yyyy-MM-dd'),
            plateNumber: tankerConfig.plateNumber,
            tankerId,
            driver: 'Juan Cruz',
            porter: 'Carlos Lopez',
            status: 'OPEN', // OPEN, SUBMITTED, LOCKED

            // Data-driven compartments from tanker configuration
            compartments: tankerConfig.compartments,

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
                    podFiles: ['POD_1_delivery.jpg'],
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
                    product: 'UNLEADED',
                    status: 'RETURNED',
                    departedAt: subHours(today, 2).toISOString(),
                    returnedAt: subHours(today, 1).toISOString(),
                    plannedQty: 4000,
                    actualQty: 3800,
                    variance: -200,
                    hasPod: true,
                    podFiles: ['POD_2_delivery.jpg'],
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
                    podFiles: [],
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
                    details: tankerConfig.compartments.map(c => `${c.name}: 500L`).join(', '),
                    timestamp: subHours(today, 6).toISOString(),
                    status: 'COMPLETED' as const,
                },
                {
                    id: 'evt-2',
                    type: 'REFILL' as const,
                    title: 'Depot Refill #1',
                    description: `Loaded ${tankerConfig.compartments.reduce((sum, c) => sum + c.maxVolume, 0).toLocaleString()}L at Depot Manila`,
                    details: tankerConfig.compartments.map(c => `${c.name}: +${c.maxVolume}L`).join(', '),
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
                    type: 'TRIP' as const,
                    title: 'Trip #2 - Petron Makati',
                    description: 'Planned: 4,000L | Actual: 3,800L | Variance: -200L',
                    details: 'C3: -1,900L, C4: -1,900L',
                    timestamp: subHours(today, 1).toISOString(),
                    status: 'COMPLETED' as const,
                },
                {
                    id: 'evt-5',
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

            // Business rule flags
            canEdit: true, // Will be false for LOCKED status
            isCurrentDay: true, // Used for day-only restrictions
        }

        // Apply business rules
        if (data.status === 'LOCKED' || data.status === 'SUBMITTED') {
            data.canEdit = false
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
