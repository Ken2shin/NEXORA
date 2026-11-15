export function formatCurrency(amount: number | null | undefined, currency = 'USD'): string {
  if (amount === null || amount === undefined) {
    return 'Consultar'
  }
  return new Intl.NumberFormat('es-MX', {
    style: 'currency',
    currency: currency,
    minimumFractionDigits: 2
  }).format(amount)
}

export function formatDate(dateStr: string): string {
  try {
    const d = new Date(dateStr)
    if (isNaN(d.getTime())) return dateStr
    const day = String(d.getDate()).padStart(2, '0')
    const month = String(d.getMonth() + 1).padStart(2, '0')
    const year = d.getFullYear()
    return `${day}/${month}/${year}`
  } catch {
    return dateStr
  }
}

export function formatRelativeTime(dateStr: string): string {
  try {
    const d = new Date(dateStr)
    const now = new Date()
    const diffMs = now.getTime() - d.getTime()
    const diffMinutes = Math.floor(diffMs / (1000 * 60))
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60))
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))

    if (diffMinutes < 1) return 'Hace un momento'
    if (diffMinutes < 60) return `Hace ${diffMinutes} min`
    if (diffHours < 24) return `Hace ${diffHours} h`
    if (diffDays === 1) return 'Hace 1 día'
    if (diffDays < 7) return `Hace ${diffDays} días`
    return formatDate(dateStr)
  } catch {
    return dateStr
  }
}

export function getStatusLabel(status: string): string {
  switch (status) {
    case 'pending':
      return 'Pendiente'
    case 'in_progress':
      return 'En Proceso'
    case 'completed':
      return 'Finalizada'
    case 'active':
      return 'Activo'
    case 'inactive':
      return 'Inactivo'
    default:
      return status
  }
}

export function getStatusBadgeClass(status: string): string {
  switch (status) {
    case 'pending':
      return 'badge-pending'
    case 'in_progress':
      return 'badge-in_progress'
    case 'completed':
      return 'badge-completed'
    case 'active':
      return 'badge-active'
    default:
      return 'badge'
  }
}

export function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9 -]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
}
