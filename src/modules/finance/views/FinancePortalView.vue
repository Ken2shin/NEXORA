<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import {
  DollarSign,
  TrendingUp,
  TrendingDown,
  FileText,
  PieChart,
  Plus
} from 'lucide-vue-next'
import { orgService } from '@/shared/infrastructure/adapters/mock/mock.organization.service'
import type { FinanceTransaction, FinanceInvoice, FinanceBudget } from '@/shared/types/organization.types'
import { formatCurrency, formatDate } from '@/shared/utils/formatters'
import { useUiStore } from '@/shared/stores/ui.store'
import BaseModal from '@/shared/components/BaseModal.vue'

const uiStore = useUiStore()

const activeTab = ref<'transactions' | 'invoices' | 'budgets' | 'reports'>('transactions')
const transactions = ref<FinanceTransaction[]>([])
const invoices = ref<FinanceInvoice[]>([])
const budgets = ref<FinanceBudget[]>([])
const isLoading = ref(true)

const isTxModalOpen = ref(false)
const txType = ref<'income' | 'expense'>('income')
const txCategory = ref('Cobro de Servicios')
const txAmount = ref(150)
const txConcept = ref('')
const txRefCode = ref('')

async function loadData() {
  isLoading.value = true
  try {
    const [t, i, b] = await Promise.all([
      orgService.getFinanceTransactions(),
      orgService.getFinanceInvoices(),
      orgService.getFinanceBudgets()
    ])
    transactions.value = t
    invoices.value = i
    budgets.value = b
  } finally {
    isLoading.value = false
  }
}

onMounted(() => {
  loadData()
})

const totalIncome = computed(() => {
  return transactions.value
    .filter(t => t.type === 'income')
    .reduce((sum, t) => sum + t.amount, 0)
})

const totalExpense = computed(() => {
  return transactions.value
    .filter(t => t.type === 'expense')
    .reduce((sum, t) => sum + t.amount, 0)
})

const netBalance = computed(() => totalIncome.value - totalExpense.value)

async function handleCreateTx() {
  if (!txConcept.value.trim() || txAmount.value <= 0) {
    uiStore.showToast('error', 'Validación', 'Indica un concepto y monto válido mayor a 0.')
    return
  }

  await orgService.createFinanceTransaction({
    type: txType.value,
    category: txCategory.value,
    amount: Number(txAmount.value),
    currency: 'USD',
    concept: txConcept.value.trim(),
    reference_code: txRefCode.value.trim() || `TX-${Date.now().toString().slice(-6)}`,
    transaction_date: new Date().toISOString(),
    status: 'confirmed'
  })

  uiStore.showToast('success', 'Movimiento registrado', 'La transacción fue guardada y auditada correctamente.')
  isTxModalOpen.value = false
  txConcept.value = ''
  await loadData()
}
</script>

<template>
  <div class="finance-portal-page">
    <div class="page-header">
      <div>
        <h1 class="page-title">Portal de Contabilidad y Finanzas</h1>
        <p class="page-subtitle">Control de ingresos, egresos, presupuestos por departamento y facturación de servicios.</p>
      </div>

      <button type="button" class="btn-primary-action" @click="isTxModalOpen = true">
        <Plus :size="16" />
        <span>Registrar Movimiento</span>
      </button>
    </div>

    <div class="kpi-financial-bar">
      <div class="kpi-fin-card">
        <div class="kpi-icon-wrap green">
          <TrendingUp :size="20" />
        </div>
        <div>
          <span class="fin-kpi-val">{{ formatCurrency(totalIncome) }}</span>
          <span class="fin-kpi-lbl">Ingresos Registrados</span>
        </div>
      </div>

      <div class="kpi-fin-card">
        <div class="kpi-icon-wrap red">
          <TrendingDown :size="20" />
        </div>
        <div>
          <span class="fin-kpi-val">{{ formatCurrency(totalExpense) }}</span>
          <span class="fin-kpi-lbl">Gastos Operativos</span>
        </div>
      </div>

      <div class="kpi-fin-card">
        <div class="kpi-icon-wrap blue">
          <DollarSign :size="20" />
        </div>
        <div>
          <span :class="['fin-kpi-val', { positive: netBalance >= 0, negative: netBalance < 0 }]">
            {{ formatCurrency(netBalance) }}
          </span>
          <span class="fin-kpi-lbl">Flujo Neto de Caja</span>
        </div>
      </div>
    </div>

    <div class="fin-tabs-bar">
      <button :class="['tab-btn', { active: activeTab === 'transactions' }]" @click="activeTab = 'transactions'">
        <DollarSign :size="16" />
        <span>Movimientos Financieros</span>
      </button>

      <button :class="['tab-btn', { active: activeTab === 'invoices' }]" @click="activeTab = 'invoices'">
        <FileText :size="16" />
        <span>Facturación y Clientes</span>
      </button>

      <button :class="['tab-btn', { active: activeTab === 'budgets' }]" @click="activeTab = 'budgets'">
        <PieChart :size="16" />
        <span>Presupuestos Departamentales</span>
      </button>
    </div>

    <div v-if="activeTab === 'transactions'" class="tab-pane">
      <div class="table-card">
        <table class="data-table">
          <thead>
            <tr>
              <th>Referencia</th>
              <th>Tipo</th>
              <th>Concepto</th>
              <th>Categoría</th>
              <th>Fecha</th>
              <th class="text-right">Monto</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="t in transactions" :key="t.id">
              <td class="font-bold text-primary">{{ t.reference_code }}</td>
              <td>
                <span :class="['type-pill', t.type]">
                  {{ t.type === 'income' ? 'Ingreso' : 'Egreso' }}
                </span>
              </td>
              <td>{{ t.concept }}</td>
              <td>{{ t.category }}</td>
              <td>{{ formatDate(t.transaction_date) }}</td>
              <td class="text-right font-bold" :class="t.type === 'income' ? 'text-green' : 'text-red'">
                {{ t.type === 'income' ? '+' : '-' }}{{ formatCurrency(t.amount) }}
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <div v-else-if="activeTab === 'invoices'" class="tab-pane">
      <div class="table-card">
        <table class="data-table">
          <thead>
            <tr>
              <th>Folio</th>
              <th>Cliente</th>
              <th>Concepto</th>
              <th>Emisión</th>
              <th>Vencimiento</th>
              <th>Estado</th>
              <th class="text-right">Total</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="inv in invoices" :key="inv.id">
              <td class="font-bold text-primary">{{ inv.invoice_number }}</td>
              <td class="font-bold">{{ inv.client_name }}</td>
              <td>{{ inv.concept }}</td>
              <td>{{ formatDate(inv.issue_date) }}</td>
              <td>{{ formatDate(inv.due_date) }}</td>
              <td>
                <span :class="['status-chip', inv.status]">
                  {{ inv.status === 'paid' ? 'Pagada' : (inv.status === 'overdue' ? 'Vencida' : 'Pendiente') }}
                </span>
              </td>
              <td class="text-right font-bold">{{ formatCurrency(inv.total_amount) }}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <div v-else-if="activeTab === 'budgets'" class="tab-pane">
      <div class="budgets-grid">
        <div v-for="b in budgets" :key="b.id" class="budget-card">
          <div class="b-head">
            <span class="b-dept">{{ b.department_name }}</span>
            <span class="b-period">Ejercicio: {{ b.period }}</span>
          </div>

          <div class="b-figures">
            <div>
              <span class="b-lbl">Presupuesto Asignado</span>
              <span class="b-val">{{ formatCurrency(b.allocated_amount) }}</span>
            </div>
            <div class="text-right">
              <span class="b-lbl">Ejercido / Gastado</span>
              <span class="b-val spent">{{ formatCurrency(b.spent_amount) }}</span>
            </div>
          </div>

          <div class="b-bar-wrap">
            <div class="b-bar-header">
              <span>Ejecución</span>
              <span>{{ Math.round((b.spent_amount / b.allocated_amount) * 100) }}%</span>
            </div>
            <div class="b-track">
              <div
                class="b-fill"
                :style="{ width: `${Math.min(100, (b.spent_amount / b.allocated_amount) * 100)}%` }"
              ></div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <BaseModal v-model="isTxModalOpen" title="Registrar Movimiento Financiero">
      <form @submit.prevent="handleCreateTx" class="modal-form">
        <div class="form-row-2">
          <div class="form-group">
            <label class="form-label">Tipo de movimiento</label>
            <select v-model="txType" class="form-select">
              <option value="income">Ingreso (+)</option>
              <option value="expense">Gasto / Egreso (-)</option>
            </select>
          </div>
          <div class="form-group">
            <label class="form-label">Monto (USD) *</label>
            <input v-model.number="txAmount" type="number" step="0.01" min="1" class="form-input" required />
          </div>
        </div>

        <div class="form-group">
          <label class="form-label">Categoría</label>
          <input v-model="txCategory" type="text" class="form-input" placeholder="Ej. Cobro de Servicios, Infraestructura" required />
        </div>

        <div class="form-group">
          <label class="form-label">Concepto o descripción *</label>
          <input v-model="txConcept" type="text" class="form-input" placeholder="Detalle de la transacción" required />
        </div>

        <div class="form-group">
          <label class="form-label">Código o folio de comprobante</label>
          <input v-model="txRefCode" type="text" class="form-input" placeholder="Ej. COMP-2026-004" />
        </div>

        <div class="modal-btn-row">
          <button type="button" class="btn-cancel" @click="isTxModalOpen = false">Cancelar</button>
          <button type="submit" class="btn-primary-action">Guardar movimiento</button>
        </div>
      </form>
    </BaseModal>
  </div>
</template>

<style scoped>
.finance-portal-page {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 16px;
}

.page-title {
  font-size: 1.5rem;
  font-weight: 800;
  color: #17366C;
  margin: 0;
}

.page-subtitle {
  font-size: 0.82rem;
  color: #71809B;
  margin: 3px 0 0 0;
}

.btn-primary-action {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  background: #087BFA;
  color: #FFFFFF;
  border: none;
  border-radius: 8px;
  padding: 9px 18px;
  font-size: 0.85rem;
  font-weight: 700;
  cursor: pointer;
}

.kpi-financial-bar {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  gap: 14px;
}

.kpi-fin-card {
  background: #FFFFFF;
  border: 1px solid #E3EAF6;
  border-radius: 12px;
  padding: 16px 20px;
  display: flex;
  align-items: center;
  gap: 14px;
  box-shadow: 0 4px 14px rgba(8, 123, 250, 0.04);
}

.kpi-icon-wrap {
  width: 44px;
  height: 44px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.kpi-icon-wrap.green { background: #DCFCE7; color: #00BA88; }
.kpi-icon-wrap.red { background: #FEE2E2; color: #EF4444; }
.kpi-icon-wrap.blue { background: #EDF5FF; color: #087BFA; }

.fin-kpi-val {
  font-size: 1.35rem;
  font-weight: 800;
  color: #17366C;
  display: block;
}

.fin-kpi-lbl {
  font-size: 0.74rem;
  color: #71809B;
  font-weight: 600;
}

.fin-tabs-bar {
  display: flex;
  gap: 8px;
  border-bottom: 2px solid #E3EAF6;
}

.tab-btn {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  background: transparent;
  border: none;
  padding: 10px 18px;
  font-size: 0.85rem;
  font-weight: 600;
  color: #71809B;
  border-radius: 8px 8px 0 0;
  cursor: pointer;
}

.tab-btn.active {
  color: #087BFA;
  font-weight: 700;
  background: #FFFFFF;
  border-bottom: 3px solid #087BFA;
}

.table-card {
  background: #FFFFFF;
  border: 1px solid #E3EAF6;
  border-radius: 14px;
  overflow: hidden;
  box-shadow: 0 4px 14px rgba(8, 123, 250, 0.04);
}

.data-table {
  width: 100%;
  border-collapse: collapse;
}

.data-table th {
  padding: 12px 16px;
  font-size: 0.75rem;
  font-weight: 700;
  color: #71809B;
  background: #F8FAFD;
  border-bottom: 1px solid #E3EAF6;
}

.data-table td {
  padding: 12px 16px;
  border-bottom: 1px solid #E3EAF6;
  font-size: 0.84rem;
}

.text-right { text-align: right; }
.font-bold { font-weight: 700; }
.text-primary { color: #087BFA; }
.text-green { color: #00BA88; }
.text-red { color: #EF4444; }

.type-pill {
  font-size: 0.7rem;
  font-weight: 700;
  padding: 2px 7px;
  border-radius: 4px;
}

.type-pill.income { background: #EBF8F2; color: #00BA88; }
.type-pill.expense { background: #FEF2F2; color: #EF4444; }

.status-chip {
  font-size: 0.7rem;
  font-weight: 700;
  padding: 2px 8px;
  border-radius: 6px;
}

.status-chip.paid { background: #EBF8F2; color: #00BA88; }
.status-chip.pending { background: #FFFBEB; color: #D97706; }
.status-chip.overdue { background: #FEF2F2; color: #EF4444; }

.budgets-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
  gap: 16px;
}

.budget-card {
  background: #FFFFFF;
  border: 1px solid #E3EAF6;
  border-radius: 14px;
  padding: 20px;
  box-shadow: 0 4px 14px rgba(8, 123, 250, 0.04);
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.b-head {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.b-dept {
  font-size: 0.95rem;
  font-weight: 700;
  color: #17366C;
}

.b-period {
  font-size: 0.75rem;
  color: #71809B;
}

.b-figures {
  display: flex;
  justify-content: space-between;
  background: #F8FAFD;
  border-radius: 8px;
  padding: 10px 14px;
}

.b-lbl {
  font-size: 0.68rem;
  color: #71809B;
  display: block;
}

.b-val {
  font-size: 0.95rem;
  font-weight: 800;
  color: #182B49;
}

.b-val.spent {
  color: #087BFA;
}

.b-bar-header {
  display: flex;
  justify-content: space-between;
  font-size: 0.72rem;
  color: #71809B;
  font-weight: 600;
  margin-bottom: 4px;
}

.b-track {
  height: 6px;
  background: #E2E8F0;
  border-radius: 3px;
  overflow: hidden;
}

.b-fill {
  height: 100%;
  background: linear-gradient(90deg, #087BFA, #8755E9);
  border-radius: 3px;
}

.modal-form {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.form-row-2 {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.form-label {
  font-size: 0.8rem;
  font-weight: 600;
  color: #182B49;
}

.form-input, .form-select {
  width: 100%;
  padding: 8px 12px;
  border: 1px solid #E3EAF6;
  border-radius: 8px;
  font-size: 0.85rem;
  outline: none;
  box-sizing: border-box;
}

.modal-btn-row {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  margin-top: 8px;
}

.btn-cancel {
  background: #FFFFFF;
  border: 1px solid #D5E0F2;
  color: #475569;
  font-size: 0.85rem;
  font-weight: 600;
  padding: 8px 16px;
  border-radius: 8px;
  cursor: pointer;
}
</style>