import type {
  Conversation,
  ConversationMessage,
  ConversationCategory
} from '@/shared/types/organization.types'
import { CryptoService } from '@/shared/utils/crypto.service'

export interface SmartClassification {
  category: ConversationCategory
  departmentId: string
  departmentName: string
  groupId: string
  groupName: string
  confidenceScore: number
  explanation: string
}

export class MockConversationsService {
  private conversations: Conversation[] = []
  private messages: ConversationMessage[] = []
  private isInitialized = false

  constructor() {
    this.initData()
  }

  private async initData() {
    if (this.isInitialized) return
    const storedConv = localStorage.getItem('nexora_conversations')
    const storedMsg = localStorage.getItem('nexora_conv_messages')

    if (storedConv && storedMsg) {
      try {
        this.conversations = JSON.parse(storedConv)
        this.messages = JSON.parse(storedMsg)
        this.isInitialized = true
        return
      } catch {}
    }

    const key = await CryptoService.generateKey()
    const keyBase64 = await CryptoService.exportKey(key)

    const payload1 = await CryptoService.encryptText(
      'Hola, tengo problemas para acceder a mi cuenta corporativa desde la nueva IP.',
      key
    )
    const payload2 = await CryptoService.encryptText(
      'Estimado Carlos, hemos verificado el bloqueo preventivo por geolocalización. Procedemos a habilitar el acceso seguro.',
      key
    )

    this.conversations = [
      {
        id: 'conv-101',
        conversation_number: 'CNV-2026-001',
        client_id: 'usr-client-1',
        client_name: 'Carlos Pérez',
        client_email: 'carlos@gmail.com',
        subject: 'Dificultad de acceso y autenticación',
        initial_query: 'Hola, tengo problemas para acceder a mi cuenta corporativa desde la nueva IP.',
        category: 'account_access',
        department_id: 'dept-1',
        department_name: 'Departamento de Tecnología',
        group_id: 'grp-1',
        group_name: 'Soporte Técnico',
        assigned_employee_id: 'emp-2',
        assigned_employee_name: 'Valeria Castro',
        priority: 'high',
        status: 'in_progress',
        e2ee_key_base64: keyBase64,
        last_activity_at: new Date(Date.now() - 3600000 * 2).toISOString(),
        transfer_history: [],
        created_at: new Date(Date.now() - 3600000 * 5).toISOString()
      },
      {
        id: 'conv-102',
        conversation_number: 'CNV-2026-002',
        client_id: 'usr-client-2',
        client_name: 'María López',
        client_email: 'maria@mail.com',
        subject: 'Aclaración de desglose en Factura #INV-2026-001',
        initial_query: 'Necesito una revisión del desglose de impuestos del servicio de Consultoría Cloud.',
        category: 'billing_finance',
        department_id: 'dept-4',
        department_name: 'Departamento de Finanzas y Contabilidad',
        group_id: 'grp-6',
        group_name: 'Facturación y Cobranza',
        assigned_employee_id: 'emp-5',
        assigned_employee_name: 'Claudia Ortiz',
        priority: 'medium',
        status: 'solution_proposed',
        e2ee_key_base64: keyBase64,
        last_activity_at: new Date(Date.now() - 3600000 * 3).toISOString(),
        solution_proposed_at: new Date(Date.now() - 3600000 * 1).toISOString(),
        transfer_history: [],
        created_at: new Date(Date.now() - 86400000).toISOString()
      }
    ]

    this.messages = [
      {
        id: 'cmsg-1',
        conversation_id: 'conv-101',
        sender_id: 'usr-client-1',
        sender_name: 'Carlos Pérez',
        sender_role: 'client',
        ciphertext: payload1.ciphertext,
        iv: payload1.iv,
        is_internal: false,
        created_at: new Date(Date.now() - 3600000 * 5).toISOString()
      },
      {
        id: 'cmsg-2',
        conversation_id: 'conv-101',
        sender_id: 'emp-2',
        sender_name: 'Valeria Castro',
        sender_role: 'employee',
        ciphertext: payload2.ciphertext,
        iv: payload2.iv,
        is_internal: false,
        created_at: new Date(Date.now() - 3600000 * 2).toISOString()
      }
    ]

    this.isInitialized = true
    this.persist()
  }

  private persist() {
    localStorage.setItem('nexora_conversations', JSON.stringify(this.conversations))
    localStorage.setItem('nexora_conv_messages', JSON.stringify(this.messages))
  }

  classifyClientNeed(query: string): SmartClassification {
    const q = query.toLowerCase()

    if (q.includes('acceso') || q.includes('contraseña') || q.includes('login') || q.includes('sesión') || q.includes('iniciar') || q.includes('bloqueo')) {
      return {
        category: 'account_access',
        departmentId: 'dept-1',
        departmentName: 'Departamento de Tecnología',
        groupId: 'grp-1',
        groupName: 'Soporte Técnico',
        confidenceScore: 0.94,
        explanation: 'Detectada necesidad de autenticación, credenciales o control de acceso.'
      }
    }

    if (q.includes('factura') || q.includes('pago') || q.includes('cobro') || q.includes('precio') || q.includes('costo') || q.includes('recibo') || q.includes('tarjeta')) {
      return {
        category: 'billing_finance',
        departmentId: 'dept-4',
        departmentName: 'Departamento de Finanzas y Contabilidad',
        groupId: 'grp-6',
        groupName: 'Facturación y Cobranza',
        confidenceScore: 0.96,
        explanation: 'Detectada consulta sobre comprobantes fiscales, cargos o cuentas por pagar.'
      }
    }

    if (q.includes('seguridad') || q.includes('ataque') || q.includes('vulnerabilidad') || q.includes('phishing') || q.includes('sospechoso') || q.includes('alerta')) {
      return {
        category: 'cybersecurity',
        departmentId: 'dept-2',
        departmentName: 'Departamento de Ciberseguridad',
        groupId: 'grp-4',
        groupName: 'Detección y Monitoreo',
        confidenceScore: 0.92,
        explanation: 'Identificado incidente potencial de seguridad informática o riesgo de red.'
      }
    }

    if (q.includes('contrato') || q.includes('convenio') || q.includes('nda') || q.includes('legal') || q.includes('cláusula') || q.includes('abogado') || q.includes('ley')) {
      return {
        category: 'legal_compliance',
        departmentId: 'dept-5',
        departmentName: 'Departamento Legal',
        groupId: 'grp-7',
        groupName: 'Asesoría de Servicios Legales',
        confidenceScore: 0.91,
        explanation: 'Identificada consulta jurídica sobre términos, convenios o cumplimiento.'
      }
    }

    if (q.includes('código') || q.includes('bug') || q.includes('error') || q.includes('api') || q.includes('desarrollo') || q.includes('pantalla') || q.includes('falla técnica')) {
      return {
        category: 'software_dev',
        departmentId: 'dept-1',
        departmentName: 'Departamento de Tecnología',
        groupId: 'grp-2',
        groupName: 'Desarrollo de Software',
        confidenceScore: 0.89,
        explanation: 'Identificado requerimiento de ingeniería de software o corrección técnica.'
      }
    }

    return {
      category: 'general',
      departmentId: 'dept-6',
      departmentName: 'Atención al Cliente',
      groupId: 'grp-8',
      groupName: 'Atención General y Orientación',
      confidenceScore: 0.75,
      explanation: 'Consulta general orientada a la mesa de primer contacto.'
    }
  }

  async getConversations(filters?: { clientId?: string; departmentId?: string; status?: string }): Promise<Conversation[]> {
    await this.initData()
    let list = [...this.conversations]

    if (filters?.clientId) {
      list = list.filter(c => c.client_id === filters.clientId)
    }

    if (filters?.departmentId && filters.departmentId !== 'all') {
      list = list.filter(c => c.department_id === filters.departmentId)
    }

    if (filters?.status && filters.status !== 'all') {
      list = list.filter(c => c.status === filters.status)
    }

    return list.sort((a, b) => new Date(b.last_activity_at).getTime() - new Date(a.last_activity_at).getTime())
  }

  async getConversationById(id: string): Promise<Conversation | null> {
    await this.initData()
    return this.conversations.find(c => c.id === id) || null
  }

  async createConversation(data: {
    clientId: string
    clientName: string
    clientEmail: string
    subject: string
    initialQuery: string
    category?: ConversationCategory
    priority?: 'low' | 'medium' | 'high' | 'urgent'
  }): Promise<Conversation> {
    await this.initData()

    const classification = this.classifyClientNeed(data.initialQuery)
    const key = await CryptoService.generateKey()
    const keyBase64 = await CryptoService.exportKey(key)

    const convId = `conv-${Date.now()}`
    const convNum = `CNV-2026-${Math.floor(100 + Math.random() * 900)}`

    const newConv: Conversation = {
      id: convId,
      conversation_number: convNum,
      client_id: data.clientId,
      client_name: data.clientName,
      client_email: data.clientEmail,
      subject: data.subject.trim() || 'Consulta de Servicio',
      initial_query: data.initialQuery.trim(),
      category: data.category || classification.category,
      department_id: classification.departmentId,
      department_name: classification.departmentName,
      group_id: classification.groupId,
      group_name: classification.groupName,
      priority: data.priority || 'medium',
      status: 'assigned',
      e2ee_key_base64: keyBase64,
      last_activity_at: new Date().toISOString(),
      transfer_history: [],
      created_at: new Date().toISOString()
    }

    this.conversations.unshift(newConv)

    const payload = await CryptoService.encryptText(data.initialQuery.trim(), key)
    const initialMsg: ConversationMessage = {
      id: `cmsg-${Date.now()}`,
      conversation_id: convId,
      sender_id: data.clientId,
      sender_name: data.clientName,
      sender_role: 'client',
      ciphertext: payload.ciphertext,
      iv: payload.iv,
      is_internal: false,
      created_at: new Date().toISOString()
    }

    this.messages.push(initialMsg)
    this.persist()
    return newConv
  }

  async getMessages(conversationId: string, currentUserId?: string, userRole?: string): Promise<Array<ConversationMessage & { decryptedContent?: string }>> {
    await this.initData()
    const conv = this.conversations.find(c => c.id === conversationId)
    if (!conv) return []

    let key: CryptoKey | null = null
    try {
      key = await CryptoService.importKey(conv.e2ee_key_base64)
    } catch {}

    const list = this.messages.filter(m => m.conversation_id === conversationId)
    const result: Array<ConversationMessage & { decryptedContent?: string }> = []

    for (const m of list) {
      if (m.is_internal && userRole === 'client') {
        continue
      }

      if (m.deleted_for_users && currentUserId && m.deleted_for_users.includes(currentUserId)) {
        continue
      }

      let text = ''
      if (m.deleted_for_all) {
        text = 'Este mensaje fue eliminado por el remitente.'
      } else if (key) {
        text = await CryptoService.decryptText({ ciphertext: m.ciphertext, iv: m.iv }, key)
      } else {
        text = '[Cifrado de Extremo a Extremo]'
      }

      result.push({
        ...m,
        decryptedContent: text
      })
    }

    return result
  }

  async sendMessage(data: {
    conversationId: string
    senderId: string
    senderName: string
    senderRole: 'client' | 'employee' | 'admin'
    plainText: string
    isInternal?: boolean
    attachmentName?: string
    attachmentData?: string
  }): Promise<ConversationMessage> {
    await this.initData()
    const conv = this.conversations.find(c => c.id === data.conversationId)
    if (!conv) throw new Error('Conversación no encontrada')

    const key = await CryptoService.importKey(conv.e2ee_key_base64)
    const payload = await CryptoService.encryptText(data.plainText.trim(), key)

    const msg: ConversationMessage = {
      id: `cmsg-${Date.now()}`,
      conversation_id: data.conversationId,
      sender_id: data.senderId,
      sender_name: data.senderName,
      sender_role: data.senderRole,
      ciphertext: payload.ciphertext,
      iv: payload.iv,
      is_internal: !!data.isInternal,
      attachment_name: data.attachmentName,
      attachment_data: data.attachmentData,
      created_at: new Date().toISOString()
    }

    this.messages.push(msg)

    conv.last_activity_at = new Date().toISOString()
    if (data.senderRole === 'client' && conv.status === 'waiting_client') {
      conv.status = 'in_progress'
    } else if (data.senderRole === 'employee' && conv.status === 'assigned') {
      conv.status = 'in_progress'
    }

    this.persist()
    return msg
  }

  async proposeSolution(conversationId: string, employeeId: string, employeeName: string): Promise<Conversation> {
    await this.initData()
    const conv = this.conversations.find(c => c.id === conversationId)
    if (!conv) throw new Error('Conversación no encontrada')

    conv.status = 'solution_proposed'
    conv.solution_proposed_at = new Date().toISOString()
    conv.last_activity_at = new Date().toISOString()

    const key = await CryptoService.importKey(conv.e2ee_key_base64)
    const promptText = 'Nos alegra haberte asistido. Hemos aplicado la resolución técnica correspondiente. ¿La información proporcionada resolvió tu consulta y te ha servido la solución?'
    const payload = await CryptoService.encryptText(promptText, key)

    this.messages.push({
      id: `cmsg-${Date.now()}`,
      conversation_id: conversationId,
      sender_id: employeeId,
      sender_name: employeeName,
      sender_role: 'employee',
      ciphertext: payload.ciphertext,
      iv: payload.iv,
      is_internal: false,
      created_at: new Date().toISOString()
    })

    this.persist()
    return conv
  }

  async respondToSolution(conversationId: string, clientId: string, clientName: string, confirmed: boolean, explanation?: string): Promise<Conversation> {
    await this.initData()
    const conv = this.conversations.find(c => c.id === conversationId)
    if (!conv) throw new Error('Conversación no encontrada')

    const key = await CryptoService.importKey(conv.e2ee_key_base64)

    if (confirmed) {
      conv.status = 'resolved'
      conv.resolution_confirmed = true
      conv.resolved_at = new Date().toISOString()
      conv.last_activity_at = new Date().toISOString()

      const confText = 'Sí, mi problema está resuelto satisfactoriamente. Gracias por la atención.'
      const payload = await CryptoService.encryptText(confText, key)
      this.messages.push({
        id: `cmsg-${Date.now()}`,
        conversation_id: conversationId,
        sender_id: clientId,
        sender_name: clientName,
        sender_role: 'client',
        ciphertext: payload.ciphertext,
        iv: payload.iv,
        is_internal: false,
        created_at: new Date().toISOString()
      })
    } else {
      conv.status = 'in_progress'
      conv.resolution_confirmed = false
      conv.last_activity_at = new Date().toISOString()

      const rejectedText = `No, todavía necesito ayuda. ${explanation ? `Detalle: ${explanation}` : 'El inconveniente persiste.'}`
      const payload = await CryptoService.encryptText(rejectedText, key)
      this.messages.push({
        id: `cmsg-${Date.now()}`,
        conversation_id: conversationId,
        sender_id: clientId,
        sender_name: clientName,
        sender_role: 'client',
        ciphertext: payload.ciphertext,
        iv: payload.iv,
        is_internal: false,
        created_at: new Date().toISOString()
      })
    }

    this.persist()
    return conv
  }

  async closeConversation(conversationId: string, employeeId: string, reason: 'confirmed_solution' | 'inactivity' | 'admin_action'): Promise<Conversation> {
    await this.initData()
    const conv = this.conversations.find(c => c.id === conversationId)
    if (!conv) throw new Error('Conversación no encontrada')

    conv.status = 'closed'
    conv.closed_at = new Date().toISOString()
    conv.closed_reason = reason
    conv.last_activity_at = new Date().toISOString()

    const key = await CryptoService.importKey(conv.e2ee_key_base64)
    const closureText = reason === 'confirmed_solution'
      ? 'Tu consulta ha sido resuelta formalmente. Gracias por confiar en NEXORA.'
      : (reason === 'inactivity' ? 'Conversación cerrada administrativamente por inactividad prolongada.' : 'Conversación concluida por supervisión.')

    const payload = await CryptoService.encryptText(closureText, key)
    this.messages.push({
      id: `cmsg-${Date.now()}`,
      conversation_id: conversationId,
      sender_id: employeeId,
      sender_name: 'NEXORA Soporte',
      sender_role: 'employee',
      ciphertext: payload.ciphertext,
      iv: payload.iv,
      is_internal: false,
      created_at: new Date().toISOString()
    })

    this.persist()
    return conv
  }

  async reopenConversation(conversationId: string, clientId: string, clientName: string, reason: string): Promise<Conversation> {
    await this.initData()
    const conv = this.conversations.find(c => c.id === conversationId)
    if (!conv) throw new Error('Conversación no encontrada')

    conv.status = 'in_progress'
    conv.closed_at = undefined
    conv.last_activity_at = new Date().toISOString()

    const key = await CryptoService.importKey(conv.e2ee_key_base64)
    const reopenText = `Reapertura de conversación solicitada por el cliente: ${reason}`
    const payload = await CryptoService.encryptText(reopenText, key)

    this.messages.push({
      id: `cmsg-${Date.now()}`,
      conversation_id: conversationId,
      sender_id: clientId,
      sender_name: clientName,
      sender_role: 'client',
      ciphertext: payload.ciphertext,
      iv: payload.iv,
      is_internal: false,
      created_at: new Date().toISOString()
    })

    this.persist()
    return conv
  }

  async transferConversation(data: {
    conversationId: string
    toDeptId: string
    toDeptName: string
    toGroupId?: string
    toGroupName?: string
    transferredBy: string
    reason: string
  }): Promise<Conversation> {
    await this.initData()
    const conv = this.conversations.find(c => c.id === data.conversationId)
    if (!conv) throw new Error('Conversación no encontrada')

    conv.transfer_history.push({
      from_dept: conv.department_name,
      from_group: conv.group_name,
      to_dept: data.toDeptName,
      to_group: data.toGroupName,
      transferred_by: data.transferredBy,
      reason: data.reason,
      transferred_at: new Date().toISOString()
    })

    conv.department_id = data.toDeptId
    conv.department_name = data.toDeptName
    conv.group_id = data.toGroupId
    conv.group_name = data.toGroupName
    conv.assigned_employee_id = undefined
    conv.assigned_employee_name = undefined
    conv.status = 'assigned'
    conv.last_activity_at = new Date().toISOString()

    const key = await CryptoService.importKey(conv.e2ee_key_base64)
    const transferNotice = `Conversación derivada internamente a ${data.toDeptName} (${data.toGroupName || 'Equipo General'}). Motivo: ${data.reason}. Historial y contexto preservados.`
    const payload = await CryptoService.encryptText(transferNotice, key)

    this.messages.push({
      id: `cmsg-${Date.now()}`,
      conversation_id: data.conversationId,
      sender_id: 'sys',
      sender_name: 'Sistema de Enrutamiento',
      sender_role: 'admin',
      ciphertext: payload.ciphertext,
      iv: payload.iv,
      is_internal: false,
      created_at: new Date().toISOString()
    })

    this.persist()
    return conv
  }

  async deleteMessage(messageId: string, userId: string, mode: 'for_me' | 'for_all'): Promise<void> {
    await this.initData()
    const msg = this.messages.find(m => m.id === messageId)
    if (!msg) throw new Error('Mensaje no encontrado')

    if (mode === 'for_all') {
      msg.deleted_for_all = true
      msg.ciphertext = ''
      msg.iv = ''
    } else {
      if (!msg.deleted_for_users) {
        msg.deleted_for_users = []
      }
      if (!msg.deleted_for_users.includes(userId)) {
        msg.deleted_for_users.push(userId)
      }
    }

    this.persist()
  }
}

export const conversationsService = new MockConversationsService()
