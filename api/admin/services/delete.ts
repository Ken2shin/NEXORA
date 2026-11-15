import type { VercelRequest, VercelResponse } from '@vercel/node'
import { createClient } from '@supabase/supabase-js'

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Método no permitido' })
  }

  const { id } = req.body || {}
  if (!id) {
    return res.status(400).json({ error: 'ID de servicio requerido' })
  }

  const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || ''
  const serviceKey = process.env.SUPABASE_SECRET_KEY || ''
  if (!supabaseUrl || !serviceKey) {
    return res.status(500).json({ error: 'Configuración de servidor incompleta (SUPABASE_SECRET_KEY no configurada)' })
  }

  const adminClient = createClient(supabaseUrl, serviceKey)

  try {
    const { data: linkedRequests } = await adminClient
      .from('service_requests')
      .select('id')
      .eq('service_id', id)

    if (linkedRequests && linkedRequests.length > 0) {
      const reqIds = linkedRequests.map((r: { id: string }) => r.id)
      await adminClient.from('request_attachments').delete().in('request_id', reqIds)
      await adminClient.from('conversations').delete().in('request_id', reqIds)
      const { error: delReqError } = await adminClient.from('service_requests').delete().eq('service_id', id)
      if (delReqError) {
        return res.status(400).json({ error: delReqError.message })
      }
    }

    const { error: delServiceError } = await adminClient.from('services').delete().eq('id', id)
    if (delServiceError) {
      return res.status(400).json({ error: delServiceError.message })
    }

    return res.status(200).json({ success: true })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Error interno al eliminar servicio'
    return res.status(500).json({ error: message })
  }
}
