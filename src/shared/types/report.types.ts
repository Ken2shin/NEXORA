export type ReportPeriod = 'all' | 'last_7_days' | 'last_30_days' | 'current_month'

export interface ServiceReportItem {
  service_name: string
  total_requests: number
  completed_requests: number
  revenue_estimate: number
}

export interface StatusReportItem {
  status: string
  count: number
  percentage: number
}

export interface ReportSummary {
  period: ReportPeriod
  total_requests: number
  completed_requests: number
  completion_rate: number
  total_clients: number
  services_breakdown: ServiceReportItem[]
  status_breakdown: StatusReportItem[]
}
