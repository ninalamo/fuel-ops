import { NextResponse } from 'next/server'
import { MockOperationsService } from '@/lib/services/mock-operations-service'

export async function GET() {
    try {
        // Get dashboard data from mock service
        const stats = MockOperationsService.getDashboardStats()
        const tankers = MockOperationsService.getTankerStatuses()
        const activeRunsRaw = MockOperationsService.getActiveRuns()

        // Transform active runs for dashboard display
        const activeRuns = activeRunsRaw.map(run => ({
            id: run.id,
            runNumber: run.runNumber,
            tanker: run.tanker.plateNumber,
            driver: run.driver.name,
            porter: run.porter.name,
            status: run.status,
            currentStation: run.drops.find(d => !d.actualLiters)?.station || run.drops[run.drops.length - 1]?.station || 'En Route',
            completedDrops: run.drops.filter(d => d.actualLiters !== null).length,
            totalDrops: run.drops.length,
        }))

        return NextResponse.json({
            stats,
            tankers,
            activeRuns,
        })
    } catch (error) {
        console.error('Error fetching dashboard data:', error)
        return NextResponse.json(
            { error: 'Failed to fetch dashboard data' },
            { status: 500 }
        )
    }
}
