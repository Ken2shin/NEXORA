import type { VercelRequest, VercelResponse } from '@vercel/node'
import { createClient } from '@supabase/supabase-js'

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Método no permitido' })
  }

  const { email, password, full_name, phone } = req.body || {}
  if (!email || !password || !full_name) {
    return res.status(400).json({ error: 'Faltan campos obligatorios' })
  }

  const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || ''
  const serviceKey = process.env.SUPABASE_SECRET_KEY || ''
  if (!supabaseUrl || !serviceKey) {
    return res.status(500).json({ error: 'Configuración de servidor incompleta (SUPABASE_SECRET_KEY no configurada)' })
  }
  const adminClient = createClient(supabaseUrl, serviceKey)

  try {
    const { data: userData, error: createError } = await adminClient.auth.admin.createUser({
      email: email.trim(),
      password: password,
      email_confirm: true,
      user_metadata: {
        full_name: full_name.trim(),
        phone: phone ? phone.trim() : null
      }
    })

    if (createError) {
      return res.status(400).json({ error: createError.message })
    }

    if (userData?.user) {
      await adminClient.from('profiles').upsert({
        id: userData.user.id,
        email: email.trim(),
        full_name: full_name.trim(),
        phone: phone ? phone.trim() : null,
        role: 'client',
        is_active: true
      })

      const { data: firstService } = await adminClient.from('services').select('id').limit(1).single()
      if (firstService) {
        await adminClient.from('service_requests').insert({
          client_id: userData.user.id,
          service_id: firstService.id,
          description: 'Solicitud de bienvenida: Configuración inicial de servicios digitales para nuevo cliente.',
          status: 'in_progress'
        })
      }

      await adminClient.from('notifications').insert({
        user_id: userData.user.id,
        title: '¡Bienvenido a NEXORA!',
        message: 'Tu cuenta ha sido creada exitosamente. Tu primera solicitud ya está en proceso de atención.',
        notification_type: 'general'
      })
    }

    return res.status(200).json({ success: true, user: userData.user })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Error al registrar usuario'
    return res.status(500).json({ error: message })
  }
}
