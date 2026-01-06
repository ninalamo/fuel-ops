import { NextRequest, NextResponse } from 'next/server'
import { getOperationsService } from '@/lib/services/operations-factory'
import { format } from 'date-fns'

export async function GET(request: NextRequest) {
    try {
        const searchParams = request.nextUrl.searchParams
        const date = searchParams.get('date') || format(new Date(), 'yyyy-MM-dd')

        const service = getOperationsService()
        const result = await service.getTankerDays(date)

        return NextResponse.json(result)
    } catch (error) {
        console.error('Error fetching tanker days:', error)
        return NextResponse.json(
            { error: 'Failed to fetch tanker days' },
            { status: 500 }
        )
    }
}

export async function POST(request: NextRequest) {
    try {
        const body = await request.json()
        const { date, tankerId } = body

        if (!date || !tankerId) {
            return NextResponse.json(
                { error: 'Date and Tanker ID are required' },
                { status: 400 }
            )
        }

        const service = getOperationsService()
        const result = await service.createTankerDay(date, tankerId)

        return NextResponse.json(result, { status: 201 })
    } catch (error) {
        console.error('Error creating tanker day:', error)
        return NextResponse.json(
            { error: 'Failed to create tanker day' },
            { status: 500 }
        )
    }
}
