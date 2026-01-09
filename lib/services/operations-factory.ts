import { IOperationsService } from './operations-interface'
import { JsonServerOperationsService } from './json-server-operations'

export function getOperationsService(): IOperationsService {
    // Always use JsonServerOperationsService - json-server must be running
    return new JsonServerOperationsService()
}

