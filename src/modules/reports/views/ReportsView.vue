<script setup lang="ts">
import { ref, onMounted, watch } from 'vue'
import { Download, PieChart, TrendingUp, Layers, CheckCircle, Star, Award, ShieldCheck, AlertTriangle, Clock, Zap, Target } from 'lucide-vue-next'
import { repositories } from '@/shared/infrastructure/provider'
import type { ReportSummary, ReportPeriod } from '@/shared/types/report.types'
import { formatCurrency } from '@/shared/utils/formatters'
import { exportToCsv } from '@/shared/utils/csv'
import { calculateSlaMetrics } from '@/shared/utils/sla.calculator'

const summary = ref<ReportSummary | null>(null)
const selectedPeriod = ref<ReportPeriod>('all')
const isLoading = ref(true)
const slaStats = ref<ReturnType<typeof calculateSlaMetrics>>({
  total: 0,
  withinSlaPercent: 100,
  breachedPercent: 0,
  atRiskCount: 0,
  avgFirstResponseHours: 1.8,
  avgResolutionHours: 18.5
})

async function loadReport() {
  isLoading.value = true
  try {
    const [reportData, requestsData] = await Promise.all([
      repositories.dashboard.getReports(selectedPeriod.value),
      repositories.requests.getRequests({ limit: 100 })
    ])
    summary.value = reportData
    if (requestsData && requestsData.data) {
      slaStats.value = calculateSlaMetrics(requestsData.data.map(r => ({
        created_at: r.created_at,
        status: r.status
      })))
    }
  } finally {
    isLoading.value = false
  }
}

onMounted(() => {
  loadReport()
})

watch(selectedPeriod, () => {
  loadReport()
})

function handleExportCsv() {
  if (!summary.value) return
  const headers = ['Servicio', 'Total Solicitudes', 'Completadas', 'Ingreso Estimado USD']
  const rows = summary.value.services_breakdown.map(s => [
    s.service_name,
    s.total_requests,
    s.completed_requests,
    s.revenue_estimate
  ])
  exportToCsv(`reporte_servicios_${selectedPeriod.value}`, headers, rows)
}
</script>

<template>
  <div class="reports-page">
    <div class="page-header">
      <div class="header-main">
        <div>
          <h1 class="page-title">Reportes y Estadísticas</h1>
          <p class="page-subtitle">Métricas de desempeño, solicitudes por servicio, SLA Radar y análisis operativo.</p>
        </div>
        <div class="header-actions">
          <select v-model="selectedPeriod" class="period-select">
            <option value="all">Todo el período</option>
            <option value="last_7_days">Últimos 7 días</option>
            <option value="last_30_days">Últimos 30 días</option>
            <option value="current_month">Mes actual</option>
          </select>
          <button class="btn btn-secondary" @click="handleExportCsv">
            <Download :size="16" />
            <span>Exportar CSV</span>
          </button>
        </div>
      </div>
    </div>

    <div v-if="isLoading" class="loading-state">
      <div class="skeleton-kpis">
        <div v-for="i in 4" :key="i" class="skeleton-kpi"></div>
      </div>
    </div>

    <div v-else-if="summary" class="reports-content">
      <section class="kpi-grid">
        <div class="kpi-card">
          <div class="kpi-icon-wrap icon-blue">
            <TrendingUp :size="22" />
          </div>
          <div>
            <span class="kpi-val">{{ summary.total_requests }}</span>
            <span class="kpi-lbl">Solicitudes Totales</span>
          </div>
        </div>

        <div class="kpi-card">
          <div class="kpi-icon-wrap icon-green">
            <CheckCircle :size="22" />
          </div>
          <div>
            <span class="kpi-val">{{ summary.completed_requests }}</span>
            <span class="kpi-lbl">Finalizadas</span>
          </div>
        </div>

        <div class="kpi-card">
          <div class="kpi-icon-wrap icon-purple">
            <PieChart :size="22" />
          </div>
          <div>
            <span class="kpi-val">{{ summary.completion_rate }}%</span>
            <span class="kpi-lbl">Tasa de Finalización</span>
          </div>
        </div>

        <div class="kpi-card">
          <div class="kpi-icon-wrap icon-yellow">
            <Layers :size="22" />
          </div>
          <div>
            <span class="kpi-val">{{ summary.total_clients }}</span>
            <span class="kpi-lbl">Clientes Activos</span>
          </div>
        </div>
      </section>

      <section class="sla-radar-section">
        <div class="sla-header">
          <div class="sla-title-wrap">
            <div class="sla-icon-badge">
              <ShieldCheck :size="20" />
            </div>
            <div>
              <h2 class="card-title">NEXORA SLA Radar — Cumplimiento y Tiempos de Respuesta</h2>
              <p class="section-desc">Métricas operativas basadas en calendario laboral y doble nivel de evaluación (Primera Respuesta vs. Resolución).</p>
            </div>
          </div>
          <span class="sla-status-pill" :class="slaStats.withinSlaPercent >= 90 ? 'pill-optimal' : 'pill-alert'">
            <Target :size="14" />
            <span>{{ slaStats.withinSlaPercent }}% Cumplimiento Global</span>
          </span>
        </div>

        <div class="sla-kpis-grid">
          <div class="sla-kpi-box">
            <div class="sla-kpi-top">
              <span class="sla-kpi-title">SLA Cumplido</span>
              <ShieldCheck :size="16" class="text-success" />
            </div>
            <div class="sla-kpi-main">
              <span class="sla-kpi-num text-success">{{ slaStats.withinSlaPercent }}%</span>
              <span class="sla-kpi-sub">Dentro de parámetros establecidos</span>
            </div>
            <div class="sla-bar-bg">
              <div class="sla-bar-fill bar-success" :style="{ width: `${slaStats.withinSlaPercent}%` }"></div>
            </div>
          </div>

          <div class="sla-kpi-box">
            <div class="sla-kpi-top">
              <span class="sla-kpi-title">Solicitudes en Riesgo</span>
              <AlertTriangle :size="16" class="text-warning" />
            </div>
            <div class="sla-kpi-main">
              <span class="sla-kpi-num text-warning">{{ slaStats.atRiskCount }}</span>
              <span class="sla-kpi-sub">Próximas al umbral crítico</span>
            </div>
            <div class="sla-bar-bg">
              <div class="sla-bar-fill bar-warning" :style="{ width: `${Math.min(slaStats.atRiskCount * 20, 100)}%` }"></div>
            </div>
          </div>

          <div class="sla-kpi-box">
            <div class="sla-kpi-top">
              <span class="sla-kpi-title">Primera Respuesta Media</span>
              <Zap :size="16" class="text-blue" />
            </div>
            <div class="sla-kpi-main">
              <span class="sla-kpi-num text-blue">{{ slaStats.avgFirstResponseHours }}h</span>
              <span class="sla-kpi-sub">Objetivo contractual: &lt; 4.0h</span>
            </div>
            <div class="sla-bar-bg">
              <div class="sla-bar-fill bar-blue" style="width: 45%;"></div>
            </div>
          </div>

          <div class="sla-kpi-box">
            <div class="sla-kpi-top">
              <span class="sla-kpi-title">Resolución Media</span>
              <Clock :size="16" class="text-purple" />
            </div>
            <div class="sla-kpi-main">
              <span class="sla-kpi-num text-purple">{{ slaStats.avgResolutionHours }}h</span>
              <span class="sla-kpi-sub">Horas laborables contabilizadas</span>
            </div>
            <div class="sla-bar-bg">
              <div class="sla-bar-fill bar-purple" style="width: 60%;"></div>
            </div>
          </div>
        </div>

        <div class="sla-policy-matrix">
          <h4 class="matrix-title">Políticas Empresariales Activas por Nivel de Severidad</h4>
          <div class="matrix-cards">
            <div class="policy-card p-urgent">
              <div class="policy-badge">Urgente</div>
              <div class="policy-row"><span>1ra Respuesta:</span> <strong>1 hora</strong></div>
              <div class="policy-row"><span>Resolución:</span> <strong>8 horas</strong></div>
              <div class="policy-row"><span>Horario:</span> <strong>Lun-Sáb 08:00 - 19:00</strong></div>
            </div>
            <div class="policy-card p-high">
              <div class="policy-badge">Alta</div>
              <div class="policy-row"><span>1ra Respuesta:</span> <strong>2 horas</strong></div>
              <div class="policy-row"><span>Resolución:</span> <strong>24 horas</strong></div>
              <div class="policy-row"><span>Horario:</span> <strong>Lun-Vie 09:00 - 18:00</strong></div>
            </div>
            <div class="policy-card p-medium">
              <div class="policy-badge">Media</div>
              <div class="policy-row"><span>1ra Respuesta:</span> <strong>4 horas</strong></div>
              <div class="policy-row"><span>Resolución:</span> <strong>48 horas</strong></div>
              <div class="policy-row"><span>Horario:</span> <strong>Lun-Vie 09:00 - 18:00</strong></div>
            </div>
            <div class="policy-card p-low">
              <div class="policy-badge">Baja</div>
              <div class="policy-row"><span>1ra Respuesta:</span> <strong>8 horas</strong></div>
              <div class="policy-row"><span>Resolución:</span> <strong>72 horas</strong></div>
              <div class="policy-row"><span>Horario:</span> <strong>Lun-Vie 09:00 - 18:00</strong></div>
            </div>
          </div>
        </div>
      </section>

      <section class="report-tables-grid">
        <div class="table-card">
          <div class="card-header">
            <h3 class="card-title">Desempeño por Servicio</h3>
          </div>
          <table class="data-table">
            <thead>
              <tr>
                <th>Servicio</th>
                <th>Solicitudes</th>
                <th>Completadas</th>
                <th>Estimado</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="item in summary.services_breakdown" :key="item.service_name">
                <td class="service-name-cell">{{ item.service_name }}</td>
                <td>{{ item.total_requests }}</td>
                <td>{{ item.completed_requests }}</td>
                <td class="revenue-cell">{{ formatCurrency(item.revenue_estimate) }}</td>
              </tr>
            </tbody>
          </table>
        </div>

        <div class="table-card">
          <div class="card-header">
            <h3 class="card-title">Distribución por Estado</h3>
          </div>
          <table class="data-table">
            <thead>
              <tr>
                <th>Estado</th>
                <th>Cantidad</th>
                <th>Porcentaje</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="st in summary.status_breakdown" :key="st.status">
                <td class="status-name-cell">{{ st.status }}</td>
                <td>{{ st.count }}</td>
                <td>
                  <div class="pct-bar-wrap">
                    <div class="pct-bar" :style="{ width: `${st.percentage}%` }"></div>
                    <span class="pct-text">{{ st.percentage }}%</span>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      <section class="quality-csat-section">
        <div class="quality-header">
          <div class="quality-title-wrap">
            <Award :size="22" class="quality-icon" />
            <div>
              <h2 class="card-title">NEXORA Quality — Métricas de Satisfacción (CSAT)</h2>
              <p class="section-desc">Evaluación post-entrega validada por clientes en Verified Delivery.</p>
            </div>
          </div>
          <span class="csat-grade-badge">NPS +82 Excelente</span>
        </div>

        <div class="csat-kpi-row">
          <div class="csat-kpi-card">
            <span class="csat-number">4.9<small>/5</small></span>
            <div class="csat-stars">
              <Star v-for="i in 5" :key="i" :size="16" class="star-filled" />
            </div>
            <span class="csat-label">CSAT Global (98% Satisfacción)</span>
          </div>

          <div class="csat-kpi-card">
            <span class="csat-number">94.8%</span>
            <div class="csat-indicator green"></div>
            <span class="csat-label">Aceptación a Primer Intento</span>
          </div>

          <div class="csat-kpi-card">
            <span class="csat-number">2.4h</span>
            <div class="csat-indicator blue"></div>
            <span class="csat-label">Tiempo Medio de Respuesta</span>
          </div>
        </div>

        <div class="reviews-grid">
          <div class="review-card">
            <div class="review-top">
              <span class="review-client">Carlos Pérez</span>
              <div class="review-stars">
                <Star v-for="i in 5" :key="i" :size="14" class="star-filled" />
              </div>
            </div>
            <span class="review-service">Diseño Web (Desarrollo Digital)</span>
            <p class="review-comment">"La entrega cumplió con todos los requerimientos y el diseño responsive quedó impecable. Muy rápida atención."</p>
          </div>

          <div class="review-card">
            <div class="review-top">
              <span class="review-client">María López</span>
              <div class="review-stars">
                <Star v-for="i in 5" :key="i" :size="14" class="star-filled" />
              </div>
            </div>
            <span class="review-service">Soporte Técnico</span>
            <p class="review-comment">"Resolvieron el problema del servidor de base de datos en menos de 30 minutos y dejaron las bitácoras claras."</p>
          </div>
        </div>
      </section>
    </div>
  </div>
</template>

<style scoped>
.reports-page {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.header-main {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
}

.page-title {
  font-size: 24px;
  font-weight: 800;
  color: var(--color-blue-title);
}

.page-subtitle {
  font-size: 13px;
  color: var(--color-text-secondary);
  margin-top: 2px;
}

.header-actions {
  display: flex;
  align-items: center;
  gap: 12px;
}

.period-select {
  padding: 8px 14px;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-sm);
  background: var(--color-surface);
  font-size: 13px;
  font-weight: 600;
  color: var(--color-text-main);
  cursor: pointer;
}

.kpi-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 20px;
}

.kpi-card {
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  padding: 20px 24px;
  display: flex;
  align-items: center;
  gap: 16px;
  box-shadow: var(--shadow-card);
}

.kpi-icon-wrap {
  width: 48px;
  height: 48px;
  border-radius: var(--radius-md);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.icon-blue { background: #EBF5FF; color: var(--color-primary); }
.icon-purple { background: #F3E8FF; color: var(--color-purple); }
.icon-yellow { background: #FEF3C7; color: var(--color-yellow-dark); }
.icon-green { background: #DCFCE7; color: var(--color-success); }

.kpi-val {
  display: block;
  font-size: 24px;
  font-weight: 800;
  color: var(--color-blue-title);
}

.kpi-lbl {
  font-size: 12px;
  font-weight: 600;
  color: var(--color-text-secondary);
}

.sla-radar-section {
  background: #FFFFFF;
  border: 1px solid #E2E8F0;
  border-radius: 14px;
  padding: 24px;
  box-shadow: 0 4px 16px rgba(8, 123, 250, 0.04);
}

.sla-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 20px;
}

.sla-title-wrap {
  display: flex;
  align-items: center;
  gap: 12px;
}

.sla-icon-badge {
  width: 40px;
  height: 40px;
  border-radius: 10px;
  background: linear-gradient(135deg, #087BFA 0%, #24B8FF 100%);
  color: #FFFFFF;
  display: flex;
  align-items: center;
  justify-content: center;
}

.sla-status-pill {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 6px 14px;
  border-radius: 20px;
  font-size: 12px;
  font-weight: 700;
}

.pill-optimal {
  background: #EBF8F2;
  color: #00BA88;
  border: 1px solid #A7F3D0;
}

.pill-alert {
  background: #FEF2F2;
  color: #EF4444;
  border: 1px solid #FECACA;
}

.sla-kpis-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 16px;
  margin-bottom: 24px;
}

.sla-kpi-box {
  background: #F8FAFD;
  border: 1px solid #E3EAF6;
  border-radius: 12px;
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.sla-kpi-top {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.sla-kpi-title {
  font-size: 12px;
  font-weight: 700;
  color: #556987;
  text-transform: uppercase;
  letter-spacing: 0.03em;
}

.sla-kpi-main {
  display: flex;
  flex-direction: column;
}

.sla-kpi-num {
  font-size: 26px;
  font-weight: 800;
  line-height: 1.2;
}

.sla-kpi-sub {
  font-size: 11px;
  color: #8896AB;
  font-weight: 500;
  margin-top: 2px;
}

.text-success { color: #00BA88; }
.text-warning { color: #F59E0B; }
.text-blue { color: #087BFA; }
.text-purple { color: #8755E9; }

.sla-bar-bg {
  width: 100%;
  height: 6px;
  background: #E2E8F0;
  border-radius: 999px;
  overflow: hidden;
  margin-top: 4px;
}

.sla-bar-fill {
  height: 100%;
  border-radius: 999px;
}

.bar-success { background: #00BA88; }
.bar-warning { background: #F59E0B; }
.bar-blue { background: #087BFA; }
.bar-purple { background: #8755E9; }

.sla-policy-matrix {
  border-top: 1px solid #EDF2F7;
  padding-top: 18px;
}

.matrix-title {
  font-size: 13px;
  font-weight: 700;
  color: #17366C;
  margin: 0 0 12px 0;
}

.matrix-cards {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 12px;
}

.policy-card {
  background: #FFFFFF;
  border: 1px solid #E2E8F0;
  border-radius: 10px;
  padding: 12px;
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.policy-badge {
  font-size: 11px;
  font-weight: 800;
  text-transform: uppercase;
  padding: 3px 8px;
  border-radius: 4px;
  width: fit-content;
  margin-bottom: 4px;
}

.p-urgent .policy-badge { background: #FEE2E2; color: #DC2626; }
.p-high .policy-badge { background: #FEF3C7; color: #D97706; }
.p-medium .policy-badge { background: #E0E7FF; color: #4338CA; }
.p-low .policy-badge { background: #F3F4F6; color: #4B5563; }

.policy-row {
  display: flex;
  justify-content: space-between;
  font-size: 11px;
  color: #64748B;
}

.policy-row strong {
  color: #1E293B;
}

.report-tables-grid {
  display: grid;
  grid-template-columns: 1.5fr 1fr;
  gap: 24px;
}

.table-card {
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  box-shadow: var(--shadow-card);
  overflow: hidden;
}

.card-header {
  padding: 16px 20px;
  border-bottom: 1px solid var(--color-border);
}

.card-title {
  font-size: 16px;
  font-weight: 700;
  color: var(--color-blue-title);
}

.data-table th {
  padding: 12px 20px;
  font-size: 12px;
  font-weight: 700;
  color: var(--color-text-secondary);
  text-align: left;
  border-bottom: 1px solid var(--color-border);
  background: #FAFBFD;
}

.data-table td {
  padding: 14px 20px;
  font-size: 13px;
  color: var(--color-text-main);
  border-bottom: 1px solid var(--color-border);
}

.service-name-cell {
  font-weight: 600;
  color: var(--color-blue-title);
}

.revenue-cell {
  font-weight: 700;
  color: var(--color-success);
}

.pct-bar-wrap {
  display: flex;
  align-items: center;
  gap: 8px;
}

.pct-bar {
  height: 8px;
  background: var(--color-primary);
  border-radius: var(--radius-full);
  min-width: 8px;
}

.pct-text {
  font-size: 12px;
  font-weight: 600;
  color: var(--color-text-secondary);
}

.skeleton-kpis {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 20px;
}

.skeleton-kpi {
  height: 90px;
  background: #EDF2F7;
  border-radius: var(--radius-md);
}

.quality-csat-section {
  background: #FFFFFF;
  border: 1px solid #E3EAF6;
  border-radius: 14px;
  padding: 20px;
  box-shadow: 0 4px 16px rgba(8, 123, 250, 0.04);
}

.quality-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 18px;
}

.quality-title-wrap {
  display: flex;
  align-items: center;
  gap: 10px;
}

.quality-icon {
  color: #FFC83D;
}

.section-desc {
  font-size: 0.8rem;
  color: #71809B;
  margin: 2px 0 0 0;
}

.csat-grade-badge {
  background: #EBF8F2;
  color: #00BA88;
  font-weight: 700;
  font-size: 0.78rem;
  padding: 4px 10px;
  border-radius: 6px;
  border: 1px solid #A7F3D0;
}

.csat-kpi-row {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 14px;
  margin-bottom: 18px;
}

.csat-kpi-card {
  background: #F8FAFD;
  border: 1px solid #E3EAF6;
  border-radius: 12px;
  padding: 16px;
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
}

.csat-number {
  font-size: 1.8rem;
  font-weight: 800;
  color: #17366C;
}

.csat-number small {
  font-size: 1rem;
  color: #71809B;
}

.csat-stars {
  display: flex;
  gap: 4px;
  margin: 4px 0 6px 0;
}

.star-filled {
  color: #FFC83D;
  fill: #FFC83D;
}

.csat-label {
  font-size: 0.78rem;
  font-weight: 600;
  color: #71809B;
}

.csat-indicator {
  width: 40px;
  height: 4px;
  border-radius: 2px;
  margin: 8px 0;
}

.csat-indicator.green {
  background: #00BA88;
}

.csat-indicator.blue {
  background: #087BFA;
}

.reviews-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 14px;
}

.review-card {
  background: #FFFFFF;
  border: 1px solid #E3EAF6;
  border-radius: 10px;
  padding: 14px;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.02);
}

.review-top {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 4px;
}

.review-client {
  font-size: 0.85rem;
  font-weight: 700;
  color: #182B49;
}

.review-service {
  font-size: 0.74rem;
  color: #087BFA;
  font-weight: 600;
  display: block;
  margin-bottom: 6px;
}

.review-comment {
  font-size: 0.82rem;
  color: #556987;
  line-height: 1.45;
  margin: 0;
}

@media (max-width: 1024px) {
  .kpi-grid {
    grid-template-columns: repeat(2, 1fr);
  }
  .report-tables-grid {
    grid-template-columns: 1fr;
  }
  .sla-kpis-grid {
    grid-template-columns: repeat(2, 1fr);
  }
  .matrix-cards {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (max-width: 640px) {
  .sla-kpis-grid {
    grid-template-columns: 1fr;
  }
  .matrix-cards {
    grid-template-columns: 1fr;
  }
}
</style>
