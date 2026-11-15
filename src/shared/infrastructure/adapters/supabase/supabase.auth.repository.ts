import type { IAuthRepository } from '@/shared/infrastructure/contracts/auth.repository'
import type { UserProfile, LoginCredentials, RegisterCredentials } from '@/shared/types/user.types'
import { getSupabaseClient } from '@/shared/infrastructure/supabase'

export class SupabaseAuthRepository implements IAuthRepository {
  private getClient() {
    const client = getSupabaseClient()
    if (!client) {
      throw new Error('Supabase no está configurado')
    }
    return client
  }

  async signIn(credentials: LoginCredentials): Promise<UserProfile> {
    const client = this.getClient()
    const emailClean = credentials.email.trim().toLowerCase()
    const { data: authData, error: authError } = await client.auth.signInWithPassword({
      email: emailClean,
      password: credentials.password
    })

    if (authError || !authData.user) {
      throw new Error(authError?.message || 'Error de autenticación')
    }

    const { data: profile, error: profileError } = await client
      .from('profiles')
      .select('*')
      .eq('id', authData.user.id)
      .single()

    if (profileError || !profile) {
      throw new Error('Perfil de usuario no encontrado')
    }

    let departmentId: string | undefined
    let departmentName: string | undefined
    let groupId: string | undefined
    let positionTitle: string | undefined
    let avatarPath = profile.avatar_path || (profile.role === 'client' ? '/images/illustrations/hero-character.jpg' : '/images/illustrations/avatar-admin.svg')
    let mustChangePassword = false

    if (profile.role === 'employee' || profile.role === 'admin') {
      try {
        const { data: empData } = await client
          .from('employees')
          .select('*, department:departments!department_id(name), position:positions!position_id(title)')
          .or(`user_id.eq.${authData.user.id},email.eq.${emailClean}`)
          .maybeSingle()

        if (empData) {
          type EmpRow = typeof empData & {
            department?: { name: string } | null
            position?: { title: string } | null
          }
          const row = empData as unknown as EmpRow
          departmentId = row.department_id
          departmentName = row.department?.name || row.department_name
          groupId = row.group_id
          positionTitle = row.position?.title || row.position_title
          if (row.avatar_url) {
            avatarPath = row.avatar_url
          }

          const { data: credData } = await client
            .from('temporary_credentials')
            .select('must_change_password')
            .eq('employee_id', row.id)
            .order('created_at', { ascending: false })
            .limit(1)
            .maybeSingle()

          if (credData && credData.must_change_password) {
            mustChangePassword = true
          }
        }
      } catch {}
    }

    return {
      ...(profile as UserProfile),
      avatar_path: avatarPath,
      department_id: departmentId,
      department_name: departmentName,
      group_id: groupId,
      position_title: positionTitle,
      must_change_password: mustChangePassword
    }
  }

  async signUp(credentials: RegisterCredentials): Promise<UserProfile> {
    const client = this.getClient()

    try {
      const apiRes = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: credentials.email.trim(),
          password: credentials.password,
          full_name: credentials.full_name.trim(),
          phone: credentials.phone?.trim() || null
        })
      })

      if (apiRes.ok) {
        const signRes = await client.auth.signInWithPassword({
          email: credentials.email.trim(),
          password: credentials.password
        })

        if (signRes.data?.user) {
          const { data: prof } = await client
            .from('profiles')
            .select('*')
            .eq('id', signRes.data.user.id)
            .single()

          if (prof) {
            return {
              ...(prof as UserProfile),
              avatar_path: prof.avatar_path || '/images/illustrations/avatar-client.svg'
            }
          }
        }
      }
    } catch {}

    const { data: authData, error: authError } = await client.auth.signUp({
      email: credentials.email.trim(),
      password: credentials.password,
      options: {
        data: {
          full_name: credentials.full_name.trim(),
          phone: credentials.phone?.trim() || null
        }
      }
    })

    if (authError || !authData.user) {
      throw new Error(authError?.message || 'Error al registrar usuario')
    }

    await client.auth.signInWithPassword({
      email: credentials.email.trim(),
      password: credentials.password
    })

    const { data: profile } = await client
      .from('profiles')
      .select('*')
      .eq('id', authData.user.id)
      .single()

    if (!profile) {
      return {
        id: authData.user.id,
        full_name: credentials.full_name.trim(),
        email: credentials.email.trim(),
        phone: credentials.phone?.trim() || null,
        role: 'client',
        avatar_path: '/images/illustrations/avatar-client.svg',
        is_active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }
    }

    return {
      ...(profile as UserProfile),
      avatar_path: profile.avatar_path || '/images/illustrations/hero-character.jpg'
    }
  }

  async signOut(): Promise<void> {
    const client = this.getClient()
    await client.auth.signOut()
  }

  async getCurrentUser(): Promise<UserProfile | null> {
    const client = this.getClient()
    const { data: { user } } = await client.auth.getUser()
    if (!user) return null

    const { data: profile } = await client
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single()

    if (!profile) return null

    let departmentId: string | undefined
    let departmentName: string | undefined
    let groupId: string | undefined
    let positionTitle: string | undefined
    let avatarPath = profile.avatar_path || (profile.role === 'client' ? '/images/illustrations/hero-character.jpg' : '/images/illustrations/avatar-admin.svg')

    if (profile.role === 'employee' || profile.role === 'admin') {
      try {
        const { data: empData } = await client
          .from('employees')
          .select('*, department:departments!department_id(name), position:positions!position_id(title)')
          .or(`user_id.eq.${user.id},email.eq.${profile.email.toLowerCase()}`)
          .maybeSingle()

        if (empData) {
          type EmpRow = typeof empData & {
            department?: { name: string } | null
            position?: { title: string } | null
          }
          const row = empData as unknown as EmpRow
          departmentId = row.department_id
          departmentName = row.department?.name || row.department_name
          groupId = row.group_id
          positionTitle = row.position?.title || row.position_title
          if (row.avatar_url) {
            avatarPath = row.avatar_url
          }
        }
      } catch {}
    }

    return {
      ...(profile as UserProfile),
      avatar_path: avatarPath,
      department_id: departmentId,
      department_name: departmentName,
      group_id: groupId,
      position_title: positionTitle
    }
  }

  async updateProfile(userId: string, data: { full_name?: string; phone?: string | null; avatar_path?: string | null }): Promise<UserProfile> {
    const client = this.getClient()
    const updatePayload: Record<string, unknown> = {
      updated_at: new Date().toISOString()
    }
    if (data.full_name !== undefined) updatePayload.full_name = data.full_name.trim()
    if (data.phone !== undefined) updatePayload.phone = data.phone?.trim() || null
    if (data.avatar_path !== undefined) updatePayload.avatar_path = data.avatar_path

    const { data: profile, error } = await client
      .from('profiles')
      .update(updatePayload)
      .eq('id', userId)
      .select()
      .single()

    if (error || !profile) {
      throw new Error(error?.message || 'Error al actualizar perfil')
    }

    return profile as UserProfile
  }

  async resetPassword(email: string): Promise<void> {
    const client = this.getClient()
    const { error } = await client.auth.resetPasswordForEmail(email.trim())
    if (error) {
      throw new Error(error.message)
    }
  }
}
