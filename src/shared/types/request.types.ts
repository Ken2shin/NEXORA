export type RequestStatus = 'pending' | 'in_progress' | 'completed'

export interface RequestAttachment {
  id: string
  request_id: string
  uploaded_by: string
  storage_path: string
  original_filename: string
  mime_type: string
  size_bytes: number
  created_at: string
}

export interface RequestStatusHistory {
  id: string
  request_id: string
  previous_status: RequestStatus | null
  new_status: RequestStatus
  changed_by: string
  changed_by_name?: string
  note: string | null
  created_at: string
}

export interface ServiceRequest {
  id: string
  request_number: string
  client_id: string
  client_name?: string
  client_email?: string
  service_id: string
  service_name?: string
  service_image?: string
  description: string
  status: RequestStatus
  assigned_to: string | null
  assigned_name?: string
  created_at: string
  updated_at: string
  attachments?: RequestAttachment[]
  history?: RequestStatusHistory[]
}

export interface RequestFilter {
  status?: RequestStatus | 'all'
  service_id?: string
  client_id?: string
  search?: string
  page?: number
  limit?: number
}

export interface CreateRequestDTO {
  service_id: string
  description: string
  files?: File[]
}

export interface UpdateRequestStatusDTO {
  request_id: string
  status: RequestStatus
  note?: string
}
