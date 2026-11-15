export interface ServiceCategory {
  id: string
  name: string
  slug: string
  description: string | null
  sort_order: number
  created_at: string
}

export interface Service {
  id: string
  category_id: string
  category_name?: string
  name: string
  slug: string
  short_description: string
  description: string
  image_path: string
  price_amount: number | null
  currency_code: string
  is_active: boolean
  created_by: string | null
  created_at: string
  updated_at: string
}

export interface ServiceFilter {
  search?: string
  category_id?: string
  is_active?: boolean
  page?: number
  limit?: number
}

export interface CreateServiceDTO {
  category_id: string
  name: string
  slug: string
  short_description: string
  description: string
  image_path: string
  price_amount?: number | null
  currency_code?: string
  is_active?: boolean
}

export interface UpdateServiceDTO extends Partial<CreateServiceDTO> {
  id: string
}
