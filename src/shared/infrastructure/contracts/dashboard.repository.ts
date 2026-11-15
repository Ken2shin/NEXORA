import type { AdminDashboardStats, ClientDashboardStats } from '@/shared/types/dashboard.types'
import type { ReportPeriod, ReportSummary } from '@/shared/types/report.types'

export interface IDashboardRepository {
  getAdminStats(): Promise<AdminDashboardStats>
  getClientStats(clientId: string): Promise<ClientDashboardStats>
  getReports(period: ReportPeriod): Promise<ReportSummary>
}
