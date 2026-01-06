import { NextRequest, NextResponse } from 'next/server'
import { getOperationsService } from '@/lib/services/operations-factory'

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params
        const service = getOperationsService()
        const detail = await service.getTankerDay(id)

        if (!detail) {
            return NextResponse.json(
                { error: 'Tanker Day not found' },
                { status: 404 }
            )
        }

        return NextResponse.json(detail)
    } catch (error) {
        console.error('Error fetching tanker day detail:', error)
        return NextResponse.json(
            { error: 'Failed to fetch tanker day details' },
            { status: 500 }
        )
    }
}
