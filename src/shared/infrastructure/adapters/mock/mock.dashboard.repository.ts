import type { IDashboardRepository } from '@/shared/infrastructure/contracts/dashboard.repository'
import type { AdminDashboardStats, ClientDashboardStats } from '@/shared/types/dashboard.types'
import type { ReportPeriod, ReportSummary, ServiceReportItem, StatusReportItem } from '@/shared/types/report.types'
import { initialRequests, initialServices, initialUsers } from './mock.data'
import { isSupabaseConfigured } from '@/shared/infrastructure/supabase'

export class MockDashboardRepository implements IDashboardRepository {
  private checkProductionPolicy(): void {
    if (import.meta.env.PROD && !isSupabaseConfigured()) {
      throw new Error('Configuración requerida: VITE_SUPABASE_URL y VITE_SUPABASE_PUBLISHABLE_KEY deben configurarse en producción.')
    }
  }

  async getAdminStats(): Promise<AdminDashboardStats> {
    this.checkProductionPolicy()
    return {
      total_services: 24,
      total_users: 128,
      total_requests: 86,
      completion_percentage: 98,
      recent_activity: [
        { day: 'Lun', count: 25 },
        { day: 'Mar', count: 45 },
        { day: 'Mié', count: 38 },
        { day: 'Jue', count: 58 },
        { day: 'Vie', count: 72 },
        { day: 'Sáb', count: 68 },
        { day: 'Dom', count: 86 }
      ],
      status_breakdown: {
        pending: 28,
        in_progress: 35,
        completed: 23,
        pending_pct: 32,
        in_progress_pct: 41,
        completed_pct: 27
      },
      pending_action_count: 3,
      recent_requests: [...initialRequests]
    }
  }

  async getClientStats(clientId: string): Promise<ClientDashboardStats> {
    this.checkProductionPolicy()
    const clientReqs = initialRequests.filter(r => r.client_id === clientId)
    const inProgress = clientReqs.filter(r => r.status === 'in_progress').length
    const completed = clientReqs.filter(r => r.status === 'completed').length

    return {
      total_requests: clientReqs.length || 3,
      in_progress_requests: inProgress || 1,
      completed_requests: completed || 2,
      recent_requests: clientReqs.length ? clientReqs : [...initialRequests]
    }
  }

  async getReports(period: ReportPeriod): Promise<ReportSummary> {
    this.checkProductionPolicy()
    const servicesBreakdown: ServiceReportItem[] = initialServices.map(s => {
      const related = initialRequests.filter(r => r.service_id === s.id)
      const count = related.length || Math.floor(Math.random() * 20) + 5
      const completedCount = Math.floor(count * 0.8)
      return {
        service_name: s.name,
        total_requests: count,
        completed_requests: completedCount,
        revenue_estimate: count * (s.price_amount || 100)
      }
    })

    const statusBreakdown: StatusReportItem[] = [
      { status: 'Pendiente', count: 28, percentage: 32 },
      { status: 'En Proceso', count: 35, percentage: 41 },
      { status: 'Finalizada', count: 23, percentage: 27 }
    ]

    return {
      period,
      total_requests: 86,
      completed_requests: 84,
      completion_rate: 98,
      total_clients: initialUsers.filter(u => u.role === 'client').length,
      services_breakdown: servicesBreakdown,
      status_breakdown: statusBreakdown
    }
  }
}
