import { describe, it, expect } from 'vitest'
import { formatCurrency, formatDate, slugify, getStatusLabel, getStatusBadgeClass } from '../../src/shared/utils/formatters'

describe('Formatters Utility', () => {
  it('formats currency correctly with default USD', () => {
    const formatted = formatCurrency(120.5)
    expect(formatted).toContain('120.50')
  })

  it('handles null and undefined currency gracefully', () => {
    expect(formatCurrency(null)).toBe('Consultar')
    expect(formatCurrency(undefined)).toBe('Consultar')
  })

  it('formats date strings in standard DD/MM/YYYY format', () => {
    const res = formatDate('2025-11-10T14:30:00Z')
    expect(res).toBe('10/11/2025')
  })

  it('slugifies titles with special characters and accents', () => {
    expect(slugify('Diseño Web & Móvil!')).toBe('diseno-web-movil')
    expect(slugify('Consultoría Estratégica 2025')).toBe('consultoria-estrategica-2025')
  })

  it('returns appropriate labels and badge classes for statuses', () => {
    expect(getStatusLabel('pending')).toBe('Pendiente')
    expect(getStatusLabel('in_progress')).toBe('En Proceso')
    expect(getStatusLabel('completed')).toBe('Finalizada')

    expect(getStatusBadgeClass('pending')).toBe('badge-pending')
    expect(getStatusBadgeClass('in_progress')).toBe('badge-in_progress')
    expect(getStatusBadgeClass('completed')).toBe('badge-completed')
  })
})
