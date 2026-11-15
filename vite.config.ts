import { defineConfig, loadEnv, type Plugin } from 'vite'
import vue from '@vitejs/plugin-vue'
import { fileURLToPath, URL } from 'node:url'
import { createClient } from '@supabase/supabase-js'

function apiDevMiddleware(): Plugin {
  return {
    name: 'api-dev-middleware',
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        if (!req.url?.startsWith('/api/')) {
          return next()
        }

        const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || ''
        const serviceKey = process.env.SUPABASE_SECRET_KEY || ''
        if (!supabaseUrl || !serviceKey) {
          res.statusCode = 500
          res.setHeader('Content-Type', 'application/json')
          res.end(JSON.stringify({ error: 'Configuración incompleta: SUPABASE_URL o SUPABASE_SECRET_KEY no encontrada en .env' }))
          return
        }
        const adminClient = createClient(supabaseUrl, serviceKey)

        if (req.method === 'POST') {
          let body = ''
          req.on('data', chunk => {
            body += chunk
          })
          req.on('end', async () => {
            res.setHeader('Content-Type', 'application/json')
            try {
              const data = body ? JSON.parse(body) : {}
              if (req.url === '/api/auth/register') {
                const { email, password, full_name, phone } = data
                const { data: userData, error: createError } = await adminClient.auth.admin.createUser({
                  email: email.trim(),
                  password,
                  email_confirm: true,
                  user_metadata: {
                    full_name: full_name.trim(),
                    phone: phone ? phone.trim() : null
                  }
                })
                if (createError) {
                  res.statusCode = 400
                  return res.end(JSON.stringify({ error: createError.message }))
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
                res.statusCode = 200
                return res.end(JSON.stringify({ success: true, user: userData.user }))
              } else if (req.url === '/api/requests/create') {
                const { client_id, service_id, description } = data
                const { data: reqData, error: reqError } = await adminClient
                  .from('service_requests')
                  .insert({
                    client_id,
                    service_id,
                    description: description.trim()
                  })
                  .select('*, client:profiles!client_id(full_name, email), service:services!service_id(name, image_path)')
                  .single()

                if (reqError) {
                  res.statusCode = 400
                  return res.end(JSON.stringify({ error: reqError.message }))
                }

                type Row = typeof reqData & {
                  client?: { full_name: string; email: string } | null
                  service?: { name: string; image_path: string } | null
                }
                const row = reqData as unknown as Row
                const formatted = {
                  ...row,
                  client_name: row.client?.full_name,
                  client_email: row.client?.email,
                  service_name: row.service?.name,
                  service_image: row.service?.image_path
                }
                res.statusCode = 200
                return res.end(JSON.stringify({ success: true, data: formatted }))
              } else if (req.url === '/api/admin/employees/create') {
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
                } = data

                const emailClean = (email || '').trim().toLowerCase()
                let userId: string | null = null

                const { data: userData, error: createError } = await adminClient.auth.admin.createUser({
                  email: emailClean,
                  password: password,
                  email_confirm: true,
                  user_metadata: {
                    role: 'employee',
                    full_name: (full_name || '').trim(),
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
                        full_name: (full_name || '').trim(),
                        phone: phone ? phone.trim() : null
                      }
                    })
                  } else {
                    res.statusCode = 400
                    return res.end(JSON.stringify({ error: createError.message }))
                  }
                } else {
                  userId = userData.user.id
                }

                await adminClient.from('profiles').upsert({
                  id: userId,
                  email: emailClean,
                  full_name: (full_name || '').trim(),
                  phone: phone ? phone.trim() : null,
                  role: 'employee',
                  is_active: status !== 'inactive'
                })

                const empId = id || `emp-${Date.now()}`
                const empRecord = {
                  id: empId,
                  internal_id: internal_id || `EMP-${Date.now().toString().slice(-4)}`,
                  user_id: userId,
                  full_name: (full_name || '').trim(),
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
                  res.statusCode = 400
                  return res.end(JSON.stringify({ error: empError.message }))
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
                  full_name: (full_name || '').trim(),
                  department_name: department_name || 'Departamento Asignado',
                  position_title: position_title || 'Colaborador',
                  temporary_password: password,
                  must_change_password: true,
                  generated_at: new Date().toISOString(),
                  expires_at: credentialRecord.expires_at
                }

                res.statusCode = 200
                return res.end(JSON.stringify({
                  success: true,
                  employee: returnedEmployee,
                  credential: returnedCredential
                }))
              } else if (req.url === '/api/admin/employees/reset-password') {
                const { employee_id, password } = data
                const { data: emp, error: empErr } = await adminClient
                  .from('employees')
                  .select('*, department:departments!department_id(name), position:positions!position_id(title)')
                  .eq('id', employee_id)
                  .single()

                if (empErr || !emp) {
                  res.statusCode = 404
                  return res.end(JSON.stringify({ error: 'Empleado no encontrado' }))
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
                      res.statusCode = 400
                      return res.end(JSON.stringify({ error: createError.message }))
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

                res.statusCode = 200
                return res.end(JSON.stringify({
                  success: true,
                  credential: returnedCredential
                }))
              }

              if (req.url === '/api/admin/services/delete') {
                const { id } = data
                if (!id) {
                  res.statusCode = 400
                  return res.end(JSON.stringify({ error: 'ID de servicio requerido' }))
                }

                const { data: linkedRequests } = await adminClient
                  .from('service_requests')
                  .select('id')
                  .eq('service_id', id)

                if (linkedRequests && linkedRequests.length > 0) {
                  const reqIds = linkedRequests.map((r: { id: string }) => r.id)
                  await adminClient.from('request_attachments').delete().in('request_id', reqIds)
                  await adminClient.from('conversations').delete().in('request_id', reqIds)
                  const { error: delReqErr } = await adminClient.from('service_requests').delete().eq('service_id', id)
                  if (delReqErr) {
                    res.statusCode = 400
                    return res.end(JSON.stringify({ error: delReqErr.message }))
                  }
                }

                const { error: delServiceErr } = await adminClient.from('services').delete().eq('id', id)
                if (delServiceErr) {
                  res.statusCode = 400
                  return res.end(JSON.stringify({ error: delServiceErr.message }))
                }

                res.statusCode = 200
                return res.end(JSON.stringify({ success: true }))
              }
              res.statusCode = 404
              res.end(JSON.stringify({ error: 'Endpoint no encontrado' }))
            } catch (err: unknown) {
              res.statusCode = 500
              const message = err instanceof Error ? err.message : 'Error interno'
              res.end(JSON.stringify({ error: message }))
            }
          })
        } else {
          next()
        }
      })
    }
  }
}

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  process.env = { ...process.env, ...env }
  return {
    envPrefix: ['VITE_', 'SUPABASE_'],
    plugins: [vue(), apiDevMiddleware()],
    resolve: {
      alias: {
        '@': fileURLToPath(new URL('./src', import.meta.url))
      }
    },
    server: {
      port: 5000,
      host: true
    },
    build: {
      target: 'esnext',
      sourcemap: false,
      chunkSizeWarningLimit: 1000,
      rollupOptions: {
        output: {
          manualChunks: {
            'vue-vendor': ['vue', 'vue-router', 'pinia'],
            'supabase-vendor': ['@supabase/supabase-js'],
            'lucide-vendor': ['lucide-vue-next']
          }
        }
      }
    }
  }
})
