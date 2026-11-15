<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import {
  Building2,
  Layers,
  Users,
  ChevronDown,
  ChevronRight,
  UserCheck,
  AlertCircle
} from 'lucide-vue-next'
import { orgService } from '@/shared/infrastructure/adapters/mock/mock.organization.service'
import type { Department, WorkGroup, Employee } from '@/shared/types/organization.types'

const departments = ref<Department[]>([])
const groups = ref<WorkGroup[]>([])
const employees = ref<Employee[]>([])
const isLoading = ref(true)

const expandedDepts = ref<Record<string, boolean>>({})
const selectedDeptId = ref<string | null>(null)

onMounted(async () => {
  isLoading.value = true
  try {
    const [d, g, e] = await Promise.all([
      orgService.getDepartments(),
      orgService.getGroups(),
      orgService.getEmployees()
    ])
    departments.value = d
    groups.value = g
    employees.value = e

    departments.value.forEach(dept => {
      expandedDepts.value[dept.id] = true
    })
  } finally {
    isLoading.value = false
  }
})

function toggleDept(deptId: string) {
  expandedDepts.value[deptId] = !expandedDepts.value[deptId]
}

function getGroupsForDept(deptId: string): WorkGroup[] {
  return groups.value.filter(g => g.department_id === deptId)
}

function getEmployeesForGroup(groupId: string): Employee[] {
  return employees.value.filter(e => e.group_id === groupId)
}

function getEmployeesForDept(deptId: string): Employee[] {
  return employees.value.filter(e => e.department_id === deptId)
}

const totalCapacity = computed(() => {
  return groups.value.reduce((acc, g) => acc + g.max_capacity, 0)
})

const totalActiveMembers = computed(() => {
  return employees.value.filter(e => e.status === 'active').length
})

const groupsWithoutLeader = computed(() => {
  return groups.value.filter(g => !g.leader_id)
})
</script>

<template>
  <div class="org-chart-wrapper">
    <div class="chart-summary-bar">
      <div class="summary-metric">
        <Building2 :size="18" class="metric-icon blue" />
        <div>
          <span class="metric-val">{{ departments.length }}</span>
          <span class="metric-lbl">Departamentos</span>
        </div>
      </div>

      <div class="summary-metric">
        <Layers :size="18" class="metric-icon purple" />
        <div>
          <span class="metric-val">{{ groups.length }}</span>
          <span class="metric-lbl">Grupos Operativos</span>
        </div>
      </div>

      <div class="summary-metric">
        <Users :size="18" class="metric-icon green" />
        <div>
          <span class="metric-val">{{ totalActiveMembers }} / {{ totalCapacity }}</span>
          <span class="metric-lbl">Ocupación Global</span>
        </div>
      </div>

      <div v-if="groupsWithoutLeader.length > 0" class="summary-metric alert">
        <AlertCircle :size="18" class="metric-icon red" />
        <div>
          <span class="metric-val">{{ groupsWithoutLeader.length }}</span>
          <span class="metric-lbl">Grupos sin líder</span>
        </div>
      </div>
    </div>

    <div v-if="isLoading" class="loading-box">
      <div class="skeleton-chart" v-for="i in 3" :key="i"></div>
    </div>

    <div v-else class="tree-container">
      <div class="root-node">
        <div class="company-badge">
          <div class="company-logo-dot"></div>
          <div>
            <h3 class="company-name">NEXORA Technologies Inc.</h3>
            <span class="company-desc">Estructura Organizacional Integral</span>
          </div>
        </div>
      </div>

      <div class="tree-branch-line"></div>

      <div class="departments-level">
        <div
          v-for="dept in departments"
          :key="dept.id"
          class="dept-branch"
        >
          <div
            :class="['dept-card', { active: selectedDeptId === dept.id }]"
            @click="toggleDept(dept.id); selectedDeptId = dept.id"
          >
            <div class="dept-card-top">
              <div class="dept-title-row">
                <component :is="expandedDepts[dept.id] ? ChevronDown : ChevronRight" :size="16" class="toggle-icon" />
                <span class="dept-code">{{ dept.code }}</span>
                <h4 class="dept-name">{{ dept.name }}</h4>
              </div>
              <span :class="['dept-status-pill', { active: dept.is_active }]">
                {{ dept.is_active ? 'Activo' : 'Inactivo' }}
              </span>
            </div>

            <div class="dept-manager-row">
              <UserCheck :size="14" class="mgr-icon" />
              <span class="mgr-label">Responsable:</span>
              <span class="mgr-name">{{ dept.manager_name || 'Sin responsable asignado' }}</span>
            </div>

            <div class="dept-footer">
              <span class="dept-sub-count">{{ getGroupsForDept(dept.id).length }} Grupos</span>
              <span class="dept-sub-count">{{ getEmployeesForDept(dept.id).length }} Colaboradores</span>
            </div>
          </div>

          <div v-if="expandedDepts[dept.id]" class="groups-subbranch">
            <div
              v-for="grp in getGroupsForDept(dept.id)"
              :key="grp.id"
              class="group-node-card"
            >
              <div class="group-node-top">
                <div class="group-title-wrap">
                  <span class="group-code-tag">{{ grp.code }}</span>
                  <span class="group-title">{{ grp.name }}</span>
                </div>
                <span :class="['leader-pill', { 'no-leader': !grp.leader_id }]">
                  {{ grp.leader_name ? `Líder: ${grp.leader_name}` : 'Vacante de líder' }}
                </span>
              </div>

              <div class="group-capacity-row">
                <div class="capacity-text-bar">
                  <span>Capacidad: {{ getEmployeesForGroup(grp.id).length }} / {{ grp.max_capacity }}</span>
                  <span class="capacity-pct">{{ Math.round((getEmployeesForGroup(grp.id).length / grp.max_capacity) * 100) }}%</span>
                </div>
                <div class="cap-track">
                  <div
                    class="cap-fill"
                    :style="{ width: `${(getEmployeesForGroup(grp.id).length / grp.max_capacity) * 100}%` }"
                  ></div>
                </div>
              </div>

              <div class="members-mini-list">
                <div
                  v-for="emp in getEmployeesForGroup(grp.id)"
                  :key="emp.id"
                  class="member-pill"
                >
                  <img :src="emp.avatar_url || '/images/illustrations/hero-character.jpg'" :alt="emp.full_name" class="member-thumb" />
                  <div class="member-info">
                    <span class="member-name">{{ emp.full_name }}</span>
                    <span class="member-pos">{{ emp.position_title }}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.org-chart-wrapper {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.chart-summary-bar {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 14px;
}

.summary-metric {
  background: #FFFFFF;
  border: 1px solid #E3EAF6;
  border-radius: 12px;
  padding: 14px 18px;
  display: flex;
  align-items: center;
  gap: 14px;
  box-shadow: 0 2px 8px rgba(8, 123, 250, 0.04);
}

.summary-metric.alert {
  background: #FEF2F2;
  border-color: #FECACA;
}

.metric-icon {
  width: 40px;
  height: 40px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.metric-icon.blue { background: #EBF5FF; color: #087BFA; }
.metric-icon.purple { background: #F3E8FF; color: #8755E9; }
.metric-icon.green { background: #DCFCE7; color: #00BA88; }
.metric-icon.red { background: #FEE2E2; color: #EF4444; }

.metric-val {
  font-size: 1.25rem;
  font-weight: 800;
  color: #17366C;
  line-height: 1.1;
  display: block;
}

.metric-lbl {
  font-size: 0.75rem;
  color: #71809B;
  font-weight: 600;
  margin-top: 2px;
  display: block;
}

.tree-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16px;
  padding: 20px 0;
  overflow-x: auto;
}

.root-node {
  display: flex;
  justify-content: center;
}

.company-badge {
  display: inline-flex;
  align-items: center;
  gap: 14px;
  background: linear-gradient(135deg, #087BFA 0%, #24B8FF 50%, #8755E9 100%);
  color: #FFFFFF;
  padding: 14px 28px;
  border-radius: 16px;
  box-shadow: 0 8px 24px rgba(8, 123, 250, 0.25);
}

.company-logo-dot {
  width: 14px;
  height: 14px;
  border-radius: 50%;
  background: #FFC83D;
  box-shadow: 0 0 10px #FFC83D;
}

.company-name {
  font-size: 1.1rem;
  font-weight: 800;
  margin: 0;
  letter-spacing: 0.3px;
}

.company-desc {
  font-size: 0.78rem;
  opacity: 0.9;
}

.tree-branch-line {
  width: 2px;
  height: 24px;
  background: #C8DCFC;
}

.departments-level {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
  gap: 20px;
  width: 100%;
}

.dept-branch {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.dept-card {
  background: #FFFFFF;
  border: 1px solid #E3EAF6;
  border-radius: 14px;
  padding: 16px;
  box-shadow: 0 4px 14px rgba(8, 123, 250, 0.05);
  cursor: pointer;
  transition: all 0.2s;
  border-top: 4px solid #087BFA;
}

.dept-card:hover {
  transform: translateY(-2px);
  border-color: #087BFA;
  box-shadow: 0 8px 20px rgba(8, 123, 250, 0.1);
}

.dept-card-top {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 8px;
}

.dept-title-row {
  display: flex;
  align-items: center;
  gap: 8px;
}

.toggle-icon {
  color: #087BFA;
}

.dept-code {
  font-size: 0.72rem;
  font-weight: 700;
  color: #087BFA;
  background: #EDF5FF;
  padding: 2px 6px;
  border-radius: 4px;
}

.dept-name {
  font-size: 0.95rem;
  font-weight: 700;
  color: #17366C;
  margin: 0;
}

.dept-status-pill {
  font-size: 0.7rem;
  font-weight: 700;
  padding: 2px 8px;
  border-radius: 10px;
}

.dept-status-pill.active {
  background: #EBF8F2;
  color: #00BA88;
}

.dept-manager-row {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 0.8rem;
  color: #556987;
  margin-bottom: 12px;
}

.mgr-icon {
  color: #00BA88;
}

.mgr-label {
  color: #71809B;
}

.mgr-name {
  font-weight: 600;
  color: #182B49;
}

.dept-footer {
  display: flex;
  justify-content: space-between;
  border-top: 1px dashed #E3EAF6;
  padding-top: 10px;
  font-size: 0.75rem;
  color: #71809B;
  font-weight: 600;
}

.groups-subbranch {
  display: flex;
  flex-direction: column;
  gap: 10px;
  padding-left: 16px;
  border-left: 2px dashed #D5E5FF;
  margin-left: 12px;
}

.group-node-card {
  background: #F8FAFD;
  border: 1px solid #E3EAF6;
  border-radius: 10px;
  padding: 12px;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.group-node-top {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
}

.group-title-wrap {
  display: flex;
  align-items: center;
  gap: 6px;
}

.group-code-tag {
  font-size: 0.68rem;
  font-weight: 700;
  color: #8755E9;
  background: #F5EEFF;
  padding: 1px 6px;
  border-radius: 4px;
}

.group-title {
  font-size: 0.86rem;
  font-weight: 700;
  color: #182B49;
}

.leader-pill {
  font-size: 0.7rem;
  font-weight: 600;
  color: #087BFA;
  background: #EDF5FF;
  padding: 2px 8px;
  border-radius: 6px;
}

.leader-pill.no-leader {
  background: #FEF2F2;
  color: #EF4444;
}

.capacity-text-bar {
  display: flex;
  justify-content: space-between;
  font-size: 0.72rem;
  color: #71809B;
  margin-bottom: 3px;
}

.cap-track {
  height: 5px;
  background: #E2E8F0;
  border-radius: 3px;
  overflow: hidden;
}

.cap-fill {
  height: 100%;
  background: linear-gradient(90deg, #087BFA, #00BA88);
  border-radius: 3px;
}

.members-mini-list {
  display: flex;
  flex-direction: column;
  gap: 6px;
  margin-top: 4px;
}

.member-pill {
  display: flex;
  align-items: center;
  gap: 8px;
  background: #FFFFFF;
  border: 1px solid #E3EAF6;
  border-radius: 8px;
  padding: 6px 10px;
}

.member-thumb {
  width: 24px;
  height: 24px;
  border-radius: 50%;
  object-fit: cover;
  object-position: center 20%;
}

.member-name {
  font-size: 0.78rem;
  font-weight: 700;
  color: #182B49;
  display: block;
}

.member-pos {
  font-size: 0.68rem;
  color: #71809B;
  display: block;
}
</style>