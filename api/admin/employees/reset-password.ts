import type { VercelRequest, VercelResponse } from '@vercel/node'
import { createClient } from '@supabase/supabase-js'

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Método no permitido' })
  }

  const { employee_id, password } = req.body || {}

  if (!employee_id || !password) {
    return res.status(400).json({ error: 'Faltan campos obligatorios: employee_id, password' })
  }

  const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || ''
  const serviceKey = process.env.SUPABASE_SECRET_KEY || ''
  if (!supabaseUrl || !serviceKey) {
    return res.status(500).json({ error: 'Configuración de servidor incompleta (SUPABASE_SECRET_KEY no configurada)' })
  }
  const adminClient = createClient(supabaseUrl, serviceKey)

  try {
    const { data: emp, error: empErr } = await adminClient
      .from('employees')
      .select('*, department:departments!department_id(name), position:positions!position_id(title)')
      .eq('id', employee_id)
      .single()

    if (empErr || !emp) {
      return res.status(404).json({ error: 'Empleado no encontrado' })
    }

    let authUserId = emp.user_id
    if (!authUserId) {
      const { data: listRes } = await adminClient.auth.admin.listUsers()
      const existing = listRes?.users.find(u => u.email?.toLowerCase() === emp.email.toLowerCase())
      if (existing) {
        authUserId = existing.id
        await adminClient.from('employees').update({ user_id: authUserId }).eq('id', emp.id)
      } else {
        const { data: newUser, error: createError } = await adminClient.auth.admin.createUser({
          email: emp.email.toLowerCase(),
          password: password,
          email_confirm: true,
          user_metadata: {
            role: 'employee',
            full_name: emp.full_name,
            phone: emp.phone || null
          }
        })
        if (createError) {
          return res.status(400).json({ error: createError.message })
        }
        authUserId = newUser.user.id
        await adminClient.from('employees').update({ user_id: authUserId }).eq('id', emp.id)
      }
    }

    if (authUserId) {
      await adminClient.auth.admin.updateUserById(authUserId, {
        password: password,
        user_metadata: {
          role: 'employee',
          full_name: emp.full_name,
          phone: emp.phone || null
        }
      })
    }

    const credentialRecord = {
      id: `cred-${Date.now()}`,
      employee_id: emp.id,
      temp_password_hash: password,
      expires_at: new Date(Date.now() + 86400000 * 30).toISOString(),
      must_change_password: true
    }

    await adminClient.from('temporary_credentials').upsert(credentialRecord)

    type EmpRow = typeof emp & {
      department?: { name: string } | null
      position?: { title: string } | null
    }
    const row = emp as unknown as EmpRow

    const returnedCredential = {
      employee_id: emp.id,
      email: emp.email,
      full_name: emp.full_name,
      department_name: row.department?.name || 'Departamento Asignado',
      position_title: row.position?.title || 'Colaborador',
      temporary_password: password,
      must_change_password: true,
      generated_at: new Date().toISOString(),
      expires_at: credentialRecord.expires_at
    }

    return res.status(200).json({
      success: true,
      credential: returnedCredential
    })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Error al actualizar credenciales'
    return res.status(500).json({ error: message })
  }
}