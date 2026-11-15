export type UserRole = 'admin' | 'employee' | 'client'

export interface UserProfile {
  id: string
  full_name: string
  email: string
  phone: string | null
  role: UserRole
  avatar_path: string | null
  is_active: boolean
  department_id?: string
  department_name?: string
  group_id?: string
  position_title?: string
  must_change_password?: boolean
  created_at: string
  updated_at: string
}

export interface AuthSession {
  user: UserProfile
  token: string
  expires_at: number
}

export interface LoginCredentials {
  email: string
  password: string
}

export interface RegisterCredentials {
  full_name: string
  email: string
  password: string
  phone?: string
}
