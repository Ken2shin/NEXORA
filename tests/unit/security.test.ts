import { describe, it, expect } from 'vitest'
import { registerSchema } from '../../src/shared/validators/auth.validator'
import { sanitizeText } from '../../src/shared/utils/sanitizer'
import { MockAuthRepository } from '../../src/shared/infrastructure/adapters/mock/mock.auth.repository'

describe('Security and OWASP Controls', () => {
  it('enforces client role default on registration regardless of attempted escalation payload', async () => {
    const authRepo = new MockAuthRepository()
    const payload = {
      full_name: 'Invasor Escalado',
      email: 'hacker@malicious.com',
      password: 'password123',
      role: 'admin'
    }

    const user = await authRepo.signUp(payload as any)
    expect(user.role).toBe('client')
    expect(user.role).not.toBe('admin')
  })

  it('prevents XSS by sanitizing input text', () => {
    const maliciousScript = '<script>alert("XSS")</script>'
    const sanitized = sanitizeText(maliciousScript)
    expect(sanitized).not.toContain('<script>')
    expect(sanitized).toBe('&lt;script&gt;alert(&quot;XSS&quot;)&lt;/script&gt;')
  })

  it('rejects passwords below 6 characters', () => {
    const short = registerSchema.safeParse({
      full_name: 'Carlos Pérez',
      email: 'carlos@empresa.com',
      password: '123'
    })
    expect(short.success).toBe(false)
  })

  it('sanitizes quotes and html tags inside user-provided notes', () => {
    const dirty = '"><img src=x onerror=alert(1)>'
    const clean = sanitizeText(dirty)
    expect(clean).not.toContain('<img')
    expect(clean).toContain('&lt;img')
  })
})
