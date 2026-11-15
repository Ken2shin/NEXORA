import type { VercelRequest, VercelResponse } from '@vercel/node'
import { createClient } from '@supabase/supabase-js'

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Método no permitido' })
  }

  const {
    id,
    email,
    password,
    full_name,
    phone,
    internal_id,
    department_id,
    department_name,
    group_id,
    group_name,
    position_id,
    position_title,
    profession,
    career,
    specialties,
    skills,
    hire_date,
    status,
    years_experience,
    responsibility_level,
    supervisor_id,
    supervisor_name,
    assigned_permissions,
    avatar_url,
    address
  } = req.body || {}

  if (!email || !password || !full_name) {
    return res.status(400).json({ error: 'Faltan campos obligatorios: email, password, full_name' })
  }

  const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || ''
  const serviceKey = process.env.SUPABASE_SECRET_KEY || ''
  if (!supabaseUrl || !serviceKey) {
    return res.status(500).json({ error: 'Configuración de servidor incompleta (SUPABASE_SECRET_KEY no configurada)' })
  }
  const adminClient = createClient(supabaseUrl, serviceKey)

  try {
    const emailClean = email.trim().toLowerCase()
    let userId: string | null = null

    const { data: userData, error: createError } = await adminClient.auth.admin.createUser({
      email: emailClean,
      password: password,
      email_confirm: true,
      user_metadata: {
        role: 'employee',
        full_name: full_name.trim(),
        phone: phone ? phone.trim() : null
      }
    })

    if (createError) {
      const { data: listRes } = await adminClient.auth.admin.listUsers()
      const existing = listRes?.users.find(u => u.email?.toLowerCase() === emailClean)
      if (existing) {
        userId = existing.id
        await adminClient.auth.admin.updateUserById(userId, {
          password: password,
          user_metadata: {
            role: 'employee',
            full_name: full_name.trim(),
            phone: phone ? phone.trim() : null
          }
        })
      } else {
        return res.status(400).json({ error: createError.message })
      }
    } else {
      userId = userData.user.id
    }

    if (!userId) {
      return res.status(500).json({ error: 'No se pudo generar el identificador de usuario' })
    }

    await adminClient.from('profiles').upsert({
      id: userId,
      email: emailClean,
      full_name: full_name.trim(),
      phone: phone ? phone.trim() : null,
      role: 'employee',
      is_active: status !== 'inactive'
    })

    const empId = id || `emp-${Date.now()}`
    const empRecord = {
      id: empId,
      internal_id: internal_id || `EMP-${Date.now().toString().slice(-4)}`,
      user_id: userId,
      full_name: full_name.trim(),
      email: emailClean,
      phone: (phone && phone.trim()) ? phone.trim() : 'N/A',
      address: address || null,
      avatar_url: avatar_url || '/images/illustrations/hero-character.jpg',
      hire_date: hire_date || new Date().toISOString().split('T')[0],
      status: status || 'active',
      department_id: department_id || 'dept-1',
      group_id: group_id || null,
      position_id: position_id || 'pos-1',
      profession: profession || 'Especialista',
      career: career || 'Ingeniería',
      specialties: specialties || [],
      skills: skills || [],
      years_experience: years_experience || 0,
      responsibility_level: responsibility_level || 'mid',
      supervisor_id: supervisor_id || null,
      assigned_permissions: assigned_permissions || ['tickets_read', 'tickets_write']
    }

    const { error: empError } = await adminClient.from('employees').upsert(empRecord)
    if (empError) {
      return res.status(400).json({ error: empError.message })
    }

    const credentialRecord = {
      id: `cred-${Date.now()}`,
      employee_id: empId,
      temp_password_hash: password,
      expires_at: new Date(Date.now() + 86400000 * 30).toISOString(),
      must_change_password: true
    }

    await adminClient.from('temporary_credentials').upsert(credentialRecord)

    const returnedEmployee = {
      ...empRecord,
      department_name: department_name || 'Departamento Asignado',
      group_name: group_name || null,
      position_title: position_title || 'Colaborador',
      supervisor_name: supervisor_name || null,
      active_tasks_count: 0,
      created_at: new Date().toISOString()
    }

    const returnedCredential = {
      employee_id: empId,
      email: emailClean,
      full_name: full_name.trim(),
      department_name: department_name || 'Departamento Asignado',
      position_title: position_title || 'Colaborador',
      temporary_password: password,
      must_change_password: true,
      generated_at: new Date().toISOString(),
      expires_at: credentialRecord.expires_at
    }

    return res.status(200).json({
      success: true,
      employee: returnedEmployee,
      credential: returnedCredential
    })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Error al registrar colaborador'
    return res.status(500).json({ error: message })
  }
}
