import { IOperationsService } from './operations-interface'
import { MockOperationsService } from './mock-operations'
// import { SupabaseOperationsService } from './supabase-operations'

import { JsonServerOperationsService } from './json-server-operations'

// Singleton instance to preserve in-memory mock state during dev
let mockServiceInstance: MockOperationsService | null = null

export function getOperationsService(): IOperationsService {
    // Check environment variables
    const useJsonServer = process.env.USE_JSON_SERVER === 'true'
    const useMock = process.env.USE_MOCK_DATA === 'true' || !process.env.DATABASE_URL

    if (useJsonServer) {
        return new JsonServerOperationsService()
    }



    // Default to Mock for now (or if user wants explicit mock mode)
    if (!mockServiceInstance) {
        mockServiceInstance = new MockOperationsService()
    }
    return mockServiceInstance
}
