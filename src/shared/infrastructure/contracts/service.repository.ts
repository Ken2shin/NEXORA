import type { Service, ServiceCategory, ServiceFilter, CreateServiceDTO, UpdateServiceDTO } from '@/shared/types/service.types'

export interface IServiceRepository {
  getCategories(): Promise<ServiceCategory[]>
  getServices(filter?: ServiceFilter): Promise<{ data: Service[]; total: number }>
  getServiceById(id: string): Promise<Service | null>
  createService(dto: CreateServiceDTO, creatorId: string): Promise<Service>
  updateService(dto: UpdateServiceDTO): Promise<Service>
  deleteService(id: string): Promise<void>
}
