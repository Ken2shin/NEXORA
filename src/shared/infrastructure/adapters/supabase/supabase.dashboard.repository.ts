import type { IDashboardRepository } from '@/shared/infrastructure/contracts/dashboard.repository'
import type { AdminDashboardStats, ClientDashboardStats } from '@/shared/types/dashboard.types'
import type { ReportPeriod, ReportSummary, ServiceReportItem, StatusReportItem } from '@/shared/types/report.types'
import type { ServiceRequest } from '@/shared/types/request.types'
import { getSupabaseClient } from '@/shared/infrastructure/supabase'

export class SupabaseDashboardRepository implements IDashboardRepository {
  private getClient() {
    const client = getSupabaseClient()
    if (!client) {
      throw new Error('Supabase no está configurado')
    }
    return client
  }

  async getAdminStats(): Promise<AdminDashboardStats> {
    const client = this.getClient()

    const [servicesRes, usersRes, requestsRes, recentReqsRes] = await Promise.all([
      client.from('services').select('id', { count: 'exact', head: true }),
      client.from('profiles').select('id', { count: 'exact', head: true }),
      client.from('service_requests').select('status, created_at'),
      client.from('service_requests')
        .select('*, client:profiles!client_id(full_name, email), service:services!service_id(name, image_path)')
        .order('created_at', { ascending: false })
        .limit(5)
    ])

    const requests = requestsRes.data || []
    const totalRequests = requests.length
    const completedCount = requests.filter(r => r.status === 'completed').length
    const pendingCount = requests.filter(r => r.status === 'pending').length
    const inProgressCount = requests.filter(r => r.status === 'in_progress').length

    const completionPercentage = totalRequests > 0 ? Math.round((completedCount / totalRequests) * 100) : 0

    const daysMap: Record<number, string> = {
      1: 'Lun',
      2: 'Mar',
      3: 'Mié',
      4: 'Jue',
      5: 'Vie',
      6: 'Sáb',
      0: 'Dom'
    }
    const daysOrder = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom']
    const countsByDay: Record<string, number> = {
      Lun: 0,
      Mar: 0,
      Mié: 0,
      Jue: 0,
      Vie: 0,
      Sáb: 0,
      Dom: 0
    }

    for (const req of requests) {
      if (req.created_at) {
        const d = new Date(req.created_at)
        const dayName = daysMap[d.getDay()]
        if (dayName && countsByDay[dayName] !== undefined) {
          countsByDay[dayName]++
        }
      }
    }

    const recentActivity = daysOrder.map(day => ({
      day,
      count: countsByDay[day] ?? 0
    }))

    type Row = ServiceRequest & {
      client?: { full_name: string; email: string } | null
      service?: { name: string; image_path: string } | null
    }

    const recentRequests: ServiceRequest[] = ((recentReqsRes.data as unknown as Row[]) || []).map(row => ({
      ...row,
      client_name: row.client?.full_name,
      client_email: row.client?.email,
      service_name: row.service?.name,
      service_image: row.service?.image_path
    }))

    return {
      total_services: servicesRes.count || 0,
      total_users: usersRes.count || 0,
      total_requests: totalRequests,
      completion_percentage: completionPercentage,
      recent_activity: recentActivity,
      status_breakdown: {
        pending: pendingCount,
        in_progress: inProgressCount,
        completed: completedCount,
        pending_pct: totalRequests > 0 ? Math.round((pendingCount / totalRequests) * 100) : 0,
        in_progress_pct: totalRequests > 0 ? Math.round((inProgressCount / totalRequests) * 100) : 0,
        completed_pct: totalRequests > 0 ? Math.round((completedCount / totalRequests) * 100) : 0
      },
      pending_action_count: pendingCount,
      recent_requests: recentRequests
    }
  }

  async getClientStats(clientId: string): Promise<ClientDashboardStats> {
    const client = this.getClient()
    const { data: reqs, error } = await client
      .from('service_requests')
      .select('*, service:services!service_id(name, image_path)')
      .eq('client_id', clientId)
      .order('created_at', { ascending: false })

    if (error) throw new Error(error.message)

    type Row = ServiceRequest & {
      service?: { name: string; image_path: string } | null
    }

    const requests: ServiceRequest[] = ((reqs as unknown as Row[]) || []).map(row => ({
      ...row,
      service_name: row.service?.name,
      service_image: row.service?.image_path
    }))

    const inProgress = requests.filter(r => r.status === 'in_progress').length
    const completed = requests.filter(r => r.status === 'completed').length

    return {
      total_requests: requests.length,
      in_progress_requests: inProgress,
      completed_requests: completed,
      recent_requests: requests.slice(0, 5)
    }
  }

  async getReports(period: ReportPeriod): Promise<ReportSummary> {
    const client = this.getClient()
    const [servicesRes, requestsRes, clientsRes] = await Promise.all([
      client.from('services').select('id, name, price_amount'),
      client.from('service_requests').select('id, service_id, status'),
      client.from('profiles').select('id', { count: 'exact', head: true }).eq('role', 'client')
    ])

    const requests = requestsRes.data || []
    const totalRequests = requests.length
    const completed = requests.filter(r => r.status === 'completed').length

    const services = servicesRes.data || []
    const servicesBreakdown: ServiceReportItem[] = services.map(s => {
      const match = requests.filter(r => r.service_id === s.id)
      const count = match.length
      const comp = match.filter(r => r.status === 'completed').length
      return {
        service_name: s.name,
        total_requests: count,
        completed_requests: comp,
        revenue_estimate: count * (s.price_amount || 0)
      }
    })

    const pending = requests.filter(r => r.status === 'pending').length
    const inProg = requests.filter(r => r.status === 'in_progress').length

    const statusBreakdown: StatusReportItem[] = [
      { status: 'Pendiente', count: pending, percentage: totalRequests > 0 ? Math.round((pending / totalRequests) * 100) : 0 },
      { status: 'En Proceso', count: inProg, percentage: totalRequests > 0 ? Math.round((inProg / totalRequests) * 100) : 0 },
      { status: 'Finalizada', count: completed, percentage: totalRequests > 0 ? Math.round((completed / totalRequests) * 100) : 0 }
    ]

    return {
      period,
      total_requests: totalRequests,
      completed_requests: completed,
      completion_rate: totalRequests > 0 ? Math.round((completed / totalRequests) * 100) : 0,
      total_clients: clientsRes.count || 0,
      services_breakdown: servicesBreakdown,
      status_breakdown: statusBreakdown
    }
  }
}