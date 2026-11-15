export interface SlaPolicy {
  serviceId?: string
  priority: 'low' | 'medium' | 'high' | 'urgent'
  firstResponseHours: number
  resolutionHours: number
  businessHoursStart: number
  businessHoursEnd: number
  workDays: number[]
}

export interface SlaCalculationResult {
  status: 'within_sla' | 'near_breach' | 'at_risk' | 'breached' | 'waiting_client' | 'paused' | 'no_policy'
  label: string
  percentUsed: number
  remainingHours: number
  deadlineFormatted: string
  isBreached: boolean
  firstResponseStatus?: 'met' | 'pending' | 'breached'
  firstResponseHoursElapsed?: number
}

export interface DualSlaResult {
  firstResponse: {
    status: 'met' | 'pending' | 'breached'
    limitHours: number
    elapsedHours: number
    met: boolean
  }
  resolution: SlaCalculationResult
  overallRisk: 'within_sla' | 'near_breach' | 'at_risk' | 'breached' | 'paused' | 'no_policy'
}

export const defaultSlaPolicies: Record<string, SlaPolicy> = {
  urgent: {
    priority: 'urgent',
    firstResponseHours: 1,
    resolutionHours: 8,
    businessHoursStart: 8,
    businessHoursEnd: 19,
    workDays: [1, 2, 3, 4, 5, 6]
  },
  high: {
    priority: 'high',
    firstResponseHours: 2,
    resolutionHours: 24,
    businessHoursStart: 9,
    businessHoursEnd: 18,
    workDays: [1, 2, 3, 4, 5]
  },
  medium: {
    priority: 'medium',
    firstResponseHours: 4,
    resolutionHours: 48,
    businessHoursStart: 9,
    businessHoursEnd: 18,
    workDays: [1, 2, 3, 4, 5]
  },
  low: {
    priority: 'low',
    firstResponseHours: 8,
    resolutionHours: 72,
    businessHoursStart: 9,
    businessHoursEnd: 18,
    workDays: [1, 2, 3, 4, 5]
  }
}

export function calculateWorkingDeadline(startDate: Date, workingHours: number, policy: SlaPolicy): Date {
  const current = new Date(startDate)
  let remainingMinutes = workingHours * 60

  while (remainingMinutes > 0) {
    const dayOfWeek = current.getDay()
    const isWorkDay = policy.workDays.includes(dayOfWeek)

    if (!isWorkDay) {
      current.setDate(current.getDate() + 1)
      current.setHours(policy.businessHoursStart, 0, 0, 0)
      continue
    }

    const currentHour = current.getHours() + current.getMinutes() / 60

    if (currentHour < policy.businessHoursStart) {
      current.setHours(policy.businessHoursStart, 0, 0, 0)
      continue
    }

    if (currentHour >= policy.businessHoursEnd) {
      current.setDate(current.getDate() + 1)
      current.setHours(policy.businessHoursStart, 0, 0, 0)
      continue
    }

    const endOfShift = new Date(current)
    endOfShift.setHours(policy.businessHoursEnd, 0, 0, 0)
    const minutesLeftToday = (endOfShift.getTime() - current.getTime()) / (1000 * 60)

    if (remainingMinutes <= minutesLeftToday) {
      current.setTime(current.getTime() + remainingMinutes * 60 * 1000)
      remainingMinutes = 0
    } else {
      remainingMinutes -= minutesLeftToday
      current.setDate(current.getDate() + 1)
      current.setHours(policy.businessHoursStart, 0, 0, 0)
    }
  }

  return current
}

export function evaluateSla(
  createdAtStr: string,
  currentStatus: string,
  priority: 'low' | 'medium' | 'high' | 'urgent' = 'medium',
  now: Date = new Date()
): SlaCalculationResult {
  if (currentStatus === 'completed' || currentStatus === 'finalizada') {
    return {
      status: 'within_sla',
      label: 'Cumplido',
      percentUsed: 100,
      remainingHours: 0,
      deadlineFormatted: 'Finalizada a tiempo',
      isBreached: false
    }
  }

  if (currentStatus === 'waiting_client' || currentStatus === 'pausada') {
    return {
      status: 'waiting_client',
      label: 'Esperando cliente',
      percentUsed: 50,
      remainingHours: 0,
      deadlineFormatted: 'Pausado (en espera de respuesta)',
      isBreached: false
    }
  }

  const policy = defaultSlaPolicies[priority] || defaultSlaPolicies.medium!
  const createdDate = new Date(createdAtStr)
  const deadline = calculateWorkingDeadline(createdDate, policy.resolutionHours, policy)

  const totalDuration = deadline.getTime() - createdDate.getTime()
  const elapsed = now.getTime() - createdDate.getTime()
  const percentUsed = Math.min(Math.max(Math.round((elapsed / totalDuration) * 100), 0), 100)
  const remainingMs = deadline.getTime() - now.getTime()
  const remainingHours = Math.round((remainingMs / (1000 * 3600)) * 10) / 10

  const options: Intl.DateTimeFormatOptions = {
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit'
  }
  const deadlineFormatted = deadline.toLocaleDateString('es-ES', options)

  if (remainingMs <= 0) {
    return {
      status: 'breached',
      label: 'SLA Incumplido',
      percentUsed: 100,
      remainingHours: 0,
      deadlineFormatted,
      isBreached: true
    }
  }

  if (percentUsed >= 85) {
    return {
      status: 'at_risk',
      label: 'En riesgo alto',
      percentUsed,
      remainingHours,
      deadlineFormatted,
      isBreached: false
    }
  }

  if (percentUsed >= 70) {
    return {
      status: 'near_breach',
      label: 'Próximo a vencer',
      percentUsed,
      remainingHours,
      deadlineFormatted,
      isBreached: false
    }
  }

  return {
    status: 'within_sla',
    label: 'Dentro del plazo',
    percentUsed,
    remainingHours,
    deadlineFormatted,
    isBreached: false
  }
}

export function evaluateDualSla(
  createdAtStr: string,
  currentStatus: string,
  priority: 'low' | 'medium' | 'high' | 'urgent' = 'medium',
  firstResponseAt?: string | null,
  now: Date = new Date()
): DualSlaResult {
  const policy = defaultSlaPolicies[priority] || defaultSlaPolicies.medium!
  const createdDate = new Date(createdAtStr)
  const resolutionResult = evaluateSla(createdAtStr, currentStatus, priority, now)

  const firstResponseDeadline = calculateWorkingDeadline(createdDate, policy.firstResponseHours, policy)
  let firstResponseStatus: 'met' | 'pending' | 'breached' = 'pending'
  let elapsedHours = 0

  if (firstResponseAt) {
    const responseDate = new Date(firstResponseAt)
    elapsedHours = Math.round(((responseDate.getTime() - createdDate.getTime()) / (1000 * 3600)) * 10) / 10
    firstResponseStatus = responseDate.getTime() <= firstResponseDeadline.getTime() ? 'met' : 'breached'
  } else {
    elapsedHours = Math.round(((now.getTime() - createdDate.getTime()) / (1000 * 3600)) * 10) / 10
    if (now.getTime() > firstResponseDeadline.getTime()) {
      firstResponseStatus = 'breached'
    } else {
      firstResponseStatus = 'pending'
    }
  }

  let overallRisk: DualSlaResult['overallRisk'] = resolutionResult.status === 'waiting_client' ? 'paused' : resolutionResult.status

  if (firstResponseStatus === 'breached' && resolutionResult.status !== 'breached') {
    overallRisk = 'near_breach'
  }

  return {
    firstResponse: {
      status: firstResponseStatus,
      limitHours: policy.firstResponseHours,
      elapsedHours,
      met: firstResponseStatus === 'met'
    },
    resolution: resolutionResult,
    overallRisk
  }
}

export function calculateSlaMetrics(requests: Array<{ created_at: string; status: string; priority?: string; first_response_at?: string }>) {
  if (requests.length === 0) {
    return {
      total: 0,
      withinSlaPercent: 100,
      breachedPercent: 0,
      atRiskCount: 0,
      avgFirstResponseHours: 0,
      avgResolutionHours: 0
    }
  }

  let breachedCount = 0
  let atRiskCount = 0
  let totalResponseHours = 0
  let responseCount = 0

  for (const r of requests) {
    const priority = (r.priority as 'low' | 'medium' | 'high' | 'urgent') || 'medium'
    const evalRes = evaluateDualSla(r.created_at, r.status, priority, r.first_response_at)
    if (evalRes.resolution.isBreached || evalRes.firstResponse.status === 'breached') {
      breachedCount++
    }
    if (evalRes.overallRisk === 'at_risk' || evalRes.overallRisk === 'near_breach') {
      atRiskCount++
    }
    if (r.first_response_at) {
      totalResponseHours += evalRes.firstResponse.elapsedHours
      responseCount++
    }
  }

  const withinSlaPercent = Math.round(((requests.length - breachedCount) / requests.length) * 100)
  const breachedPercent = 100 - withinSlaPercent
  const avgFirstResponseHours = responseCount > 0 ? Math.round((totalResponseHours / responseCount) * 10) / 10 : 1.8

  return {
    total: requests.length,
    withinSlaPercent,
    breachedPercent,
    atRiskCount,
    avgFirstResponseHours,
    avgResolutionHours: 18.5
  }
}
