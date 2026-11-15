import { createClient, type SupabaseClient } from '@supabase/supabase-js'

const supabaseUrl = (import.meta.env.VITE_SUPABASE_URL || import.meta.env.SUPABASE_URL) as string | undefined
const supabaseKey = (import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY || import.meta.env.SUPABASE_PUBLISHABLE_KEY) as string | undefined

export function isSupabaseConfigured(): boolean {
  return Boolean(
    supabaseUrl &&
    supabaseKey &&
    supabaseUrl !== 'https://your-project-id.supabase.co' &&
    supabaseKey !== 'your-supabase-publishable-key' &&
    supabaseKey !== 'your-supabase-anon-key'
  )
}

let clientInstance: SupabaseClient | null = null

export function getSupabaseClient(): SupabaseClient | null {
  if (!isSupabaseConfigured()) {
    return null
  }
  if (!clientInstance && supabaseUrl && supabaseKey) {
    clientInstance = createClient(supabaseUrl, supabaseKey)
  }
  return clientInstance
}
