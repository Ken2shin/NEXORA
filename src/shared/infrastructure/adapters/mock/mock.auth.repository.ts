import type { IAuthRepository } from '@/shared/infrastructure/contracts/auth.repository'
import type { UserProfile, LoginCredentials, RegisterCredentials } from '@/shared/types/user.types'
import { initialUsers } from './mock.data'
import { isSupabaseConfigured } from '@/shared/infrastructure/supabase'

export class MockAuthRepository implements IAuthRepository {
  private users: UserProfile[] = [...initialUsers]
  private currentUser: UserProfile | null = null

  constructor() {
    this.checkProductionPolicy()
  }

  private checkProductionPolicy(): void {
    if (import.meta.env.PROD && !isSupabaseConfigured()) {
      throw new Error('Configuración requerida: VITE_SUPABASE_URL y VITE_SUPABASE_PUBLISHABLE_KEY deben configurarse en producción.')
    }
  }

  async signIn(credentials: LoginCredentials): Promise<UserProfile> {
    this.checkProductionPolicy()
    const emailLower = credentials.email.trim().toLowerCase()

    const storedEmps = typeof localStorage !== 'undefined' ? localStorage.getItem('nexora_org_employees') : null
    if (storedEmps) {
      try {
        const emps = JSON.parse(storedEmps)
        const matchedEmp = emps.find((e: { email: string; status: string; id: string; full_name: string; phone: string; avatar_url?: string; department_id: string; department_name?: string; group_id?: string; position_title?: string; created_at: string }) => e.email.toLowerCase() === emailLower)
        if (matchedEmp) {
          if (matchedEmp.status === 'inactive') {
            throw new Error('Esta cuenta de colaborador ha sido desactivada.')
          }
          const storedCreds = typeof localStorage !== 'undefined' ? localStorage.getItem('nexora_org_credentials') : null
          let mustChange = false
          if (storedCreds) {
            const creds = JSON.parse(storedCreds)
            const c = creds.find((x: { email: string; must_change_password: boolean }) => x.email.toLowerCase() === emailLower)
            if (c) mustChange = c.must_change_password
          }
          const empUser: UserProfile = {
            id: matchedEmp.id,
            full_name: matchedEmp.full_name,
            email: matchedEmp.email,
            phone: matchedEmp.phone,
            role: 'employee',
            avatar_path: matchedEmp.avatar_url || '/images/illustrations/avatar-admin.svg',
            is_active: matchedEmp.status === 'active',
            department_id: matchedEmp.department_id,
            department_name: matchedEmp.department_name,
            group_id: matchedEmp.group_id,
            position_title: matchedEmp.position_title,
            must_change_password: mustChange,
            created_at: matchedEmp.created_at,
            updated_at: new Date().toISOString()
          }
          this.currentUser = empUser
          return empUser
        }
      } catch (err: unknown) {
        if (err instanceof Error && err.message.includes('desactivada')) throw err
      }
    }

    const found = this.users.find(u => u.email.toLowerCase() === emailLower)

    if (!found) {
      if (emailLower.includes('admin')) {
        this.currentUser = this.users[0]!
        return this.currentUser
      }
      if (emailLower.includes('empleado')) {
        this.currentUser = this.users[1]!
        return this.currentUser
      }
      this.currentUser = this.users[2]!
      return this.currentUser
    }

    if (!found.is_active) {
      throw new Error('Esta cuenta ha sido desactivada. Contacta al administrador.')
    }

    this.currentUser = found
    return found
  }

  async signUp(credentials: RegisterCredentials): Promise<UserProfile> {
    this.checkProductionPolicy()
    const emailLower = credentials.email.trim().toLowerCase()
    const exists = this.users.some(u => u.email.toLowerCase() === emailLower)
    if (exists) {
      throw new Error('El correo electrónico ya se encuentra registrado.')
    }

    const newUser: UserProfile = {
      id: `u-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      full_name: credentials.full_name.trim(),
      email: emailLower,
      phone: credentials.phone?.trim() || null,
      role: 'client',
      avatar_path: '/images/illustrations/avatar-client.svg',
      is_active: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }

    this.users.push(newUser)
    this.currentUser = newUser
    return newUser
  }

  async signOut(): Promise<void> {
    this.currentUser = null
  }

  async getCurrentUser(): Promise<UserProfile | null> {
    return this.currentUser
  }

  async updateProfile(userId: string, data: { full_name?: string; phone?: string | null; avatar_path?: string | null }): Promise<UserProfile> {
    this.checkProductionPolicy()
    const user = this.users.find(u => u.id === userId)
    if (!user) {
      throw new Error('Usuario no encontrado')
    }

    if (data.full_name !== undefined) user.full_name = data.full_name.trim()
    if (data.phone !== undefined) user.phone = data.phone?.trim() || null
    if (data.avatar_path !== undefined) user.avatar_path = data.avatar_path
    user.updated_at = new Date().toISOString()

    if (this.currentUser && this.currentUser.id === userId) {
      this.currentUser = { ...user }
    }

    return { ...user }
  }

  async resetPassword(email: string): Promise<void> {
    this.checkProductionPolicy()
    const exists = this.users.some(u => u.email.toLowerCase() === email.trim().toLowerCase())
    if (!exists) {
      throw new Error('No existe una cuenta asociada a este correo.')
    }
  }

  setCurrentUserDirectly(user: UserProfile | null): void {
    this.currentUser = user
  }
}
