import type { ServiceRequest } from './request.types'

export interface DailyActivityPoint {
  day: string
  count: number
}

export interface StatusBreakdown {
  pending: number
  in_progress: number
  completed: number
  pending_pct: number
  in_progress_pct: number
  completed_pct: number
}

export interface AdminDashboardStats {
  total_services: number
  total_users: number
  total_requests: number
  completion_percentage: number
  recent_activity: DailyActivityPoint[]
  status_breakdown: StatusBreakdown
  pending_action_count: number
  recent_requests: ServiceRequest[]
}

export interface ClientDashboardStats {
  total_requests: number
  in_progress_requests: number
  completed_requests: number
  recent_requests: ServiceRequest[]
}
