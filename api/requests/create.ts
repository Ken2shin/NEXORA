import type { VercelRequest, VercelResponse } from '@vercel/node'
import { createClient } from '@supabase/supabase-js'

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Método no permitido' })
  }

  const { client_id, service_id, description } = req.body || {}
  if (!client_id || !service_id || !description) {
    return res.status(400).json({ error: 'Faltan campos obligatorios' })
  }

  const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || ''
  const serviceKey = process.env.SUPABASE_SECRET_KEY || ''
  if (!supabaseUrl || !serviceKey) {
    return res.status(500).json({ error: 'Configuración de servidor incompleta (SUPABASE_SECRET_KEY no configurada)' })
  }
  const adminClient = createClient(supabaseUrl, serviceKey)

  try {
    const { data, error } = await adminClient
      .from('service_requests')
      .insert({
        client_id,
        service_id,
        description: description.trim()
      })
      .select('*, client:profiles!client_id(full_name, email), service:services!service_id(name, image_path)')
      .single()

    if (error) {
      return res.status(400).json({ error: error.message })
    }

    type Row = typeof data & {
      client?: { full_name: string; email: string } | null
      service?: { name: string; image_path: string } | null
    }

    const row = data as unknown as Row
    const formatted = {
      ...row,
      client_name: row.client?.full_name,
      client_email: row.client?.email,
      service_name: row.service?.name,
      service_image: row.service?.image_path
    }

    return res.status(200).json({ success: true, data: formatted })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Error al procesar solicitud'
    return res.status(500).json({ error: message })
  }
}
