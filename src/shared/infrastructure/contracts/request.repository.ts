import type { ServiceRequest, RequestFilter, CreateRequestDTO, UpdateRequestStatusDTO } from '@/shared/types/request.types'

export interface IRequestRepository {
  getRequests(filter?: RequestFilter): Promise<{ data: ServiceRequest[]; total: number }>
  getRequestById(id: string): Promise<ServiceRequest | null>
  createRequest(clientId: string, dto: CreateRequestDTO): Promise<ServiceRequest>
  updateStatus(dto: UpdateRequestStatusDTO, changedById: string): Promise<ServiceRequest>
  assignSpecialist(requestId: string, employeeId: string, employeeName?: string): Promise<ServiceRequest>
}
