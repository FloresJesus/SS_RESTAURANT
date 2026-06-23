<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useReportsStore } from '../stores/reports'

const reportsStore = useReportsStore()

const activeTab = ref<'generar' | 'historial'>('generar')

const selectedTipo = ref('')
const fechaInicio = ref(new Date().toISOString().split('T')[0])
const fechaFin = ref(new Date().toISOString().split('T')[0])
const searchQuery = ref('')
const filterTipo = ref('')
const currentPage = ref(1)
const pageSize = 12

const TIPO_LABELS: Record<string, string> = {
  ventas_diarias: 'Ventas Diarias',
  ventas_periodo: 'Ventas por Periodo',
  productos_mas_vendidos: 'Productos Más Vendidos',
  ventas_por_categoria: 'Ventas por Categoría',
  ocupacion_mesas: 'Ocupación de Mesas',
  rendimiento_meseros: 'Rendimiento de Meseros',
  historial_pedidos: 'Historial de Pedidos',
  historial_pagos: 'Historial de Pagos',
  reservas: 'Reservas',
  cierre_caja: 'Cierre de Caja'
}

const TIPO_ICONS: Record<string, string> = {
  ventas_diarias: 'today',
  ventas_periodo: 'date_range',
  productos_mas_vendidos: 'trending_up',
  ventas_por_categoria: 'category',
  ocupacion_mesas: 'table_restaurant',
  rendimiento_meseros: 'badge',
  historial_pedidos: 'receipt_long',
  historial_pagos: 'payments',
  reservas: 'calendar_month',
  cierre_caja: 'account_balance'
}

const filteredReports = computed(() => {
  const searchText = searchQuery.value.toLowerCase()
  return reportsStore.reports.filter(r => {
    if (filterTipo.value && r.tipo !== filterTipo.value) return false
    if (searchText) {
      return (
        r.usuario_nombre.toLowerCase().includes(searchText) ||
        r.usuario_email.toLowerCase().includes(searchText) ||
        r.tipo.toLowerCase().includes(searchText)
      )
    }
    return true
  })
})

const totalPages = computed(() => Math.max(1, Math.ceil(filteredReports.value.length / pageSize)))

const paginatedReports = computed(() => {
  const start = (currentPage.value - 1) * pageSize
  return filteredReports.value.slice(start, start + pageSize)
})

const stats = computed(() => ({
  total: reportsStore.reports.length,
  filtered: filteredReports.value.length,
  tipos: reportsStore.tipos.length
}))

const canGenerate = computed(() => {
  if (selectedTipo.value === 'ventas_diarias' || selectedTipo.value === 'cierre_caja') return true
  return selectedTipo.value && fechaInicio.value && fechaFin.value
})

const formatDate = (dateStr: string) => {
  const d = new Date(dateStr)
  return d.toLocaleDateString('es-BO', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}

const formatCurrency = (amount: number | null) => {
  if (amount === null || amount === undefined) return '-'
  return `Bs ${Number(amount).toFixed(2)}`
}

const getTipoIcon = (tipo: string) => TIPO_ICONS[tipo] || 'description'

const isTodayReport = computed(() => {
  return selectedTipo.value === 'ventas_diarias' || selectedTipo.value === 'cierre_caja'
})

const handleGenerate = async () => {
  if (!selectedTipo.value) return

  const params: Record<string, any> = {}
  if (isTodayReport.value) {
    params.fecha = fechaInicio.value
  } else {
    params.fecha_inicio = fechaInicio.value
    params.fecha_fin = fechaFin.value
  }

  try {
    await reportsStore.generateReport(selectedTipo.value, params)
    activeTab.value = 'historial'
    await reportsStore.fetchReports()
  } catch {
    // error is handled by store
  }
}

const handleDownload = (id: number) => {
  const token = localStorage.getItem('token')
  const url = `/api/reports/download/${id}`
  const xhr = new XMLHttpRequest()
  xhr.open('GET', url, true)
  xhr.setRequestHeader('Authorization', `Bearer ${token}`)
  xhr.responseType = 'blob'
  xhr.onload = () => {
    if (xhr.status === 200) {
      const blob = xhr.response
      const link = document.createElement('a')
      link.href = URL.createObjectURL(blob)
      link.download = `reporte_${id}.pdf`
      link.click()
      URL.revokeObjectURL(link.href)
    }
  }
  xhr.send()
}

const handleDelete = async (id: number) => {
  if (confirm('¿Estás seguro de eliminar este reporte?')) {
    await reportsStore.deleteReport(id)
  }
}

const loadData = async () => {
  await Promise.all([
    reportsStore.fetchTipos(),
    reportsStore.fetchReports()
  ])
}

onMounted(loadData)
</script>

<template>
  <div class="reports-page">
    <!-- Header -->
    <div class="page-header">
      <div class="header-info">
        <h1 class="page-title">Reportes</h1>
        <p class="page-subtitle">Genera y consulta reportes del sistema</p>
      </div>
    </div>

    <!-- Tabs -->
    <div class="tabs">
      <button
        :class="['tab', { 'tab-active': activeTab === 'generar' }]"
        @click="activeTab = 'generar'"
      >
        <span class="material-symbols-outlined">add_circle</span>
        Generar Reporte
      </button>
      <button
        :class="['tab', { 'tab-active': activeTab === 'historial' }]"
        @click="activeTab = 'historial'"
      >
        <span class="material-symbols-outlined">history</span>
        Historial
        <span v-if="reportsStore.reports.length" class="tab-count">{{ reportsStore.reports.length }}</span>
      </button>
    </div>

    <!-- Tab: Generar -->
    <div v-if="activeTab === 'generar'" class="generate-section">
      <div class="card generate-card">
        <h3 class="card-title">Nuevo Reporte</h3>
        <p class="card-subtitle">Selecciona el tipo de reporte y el período</p>

        <div class="form-grid">
          <div class="form-group">
            <label class="label">Tipo de Reporte</label>
            <div class="tipo-grid">
              <button
                v-for="tipo in reportsStore.tipos"
                :key="tipo.value"
                :class="['tipo-card', { 'tipo-card-selected': selectedTipo === tipo.value }]"
                @click="selectedTipo = tipo.value"
              >
                <span class="material-symbols-outlined tipo-icon">{{ getTipoIcon(tipo.value) }}</span>
                <span class="tipo-label">{{ tipo.label }}</span>
              </button>
            </div>
          </div>

          <div class="date-row">
            <div class="form-group">
              <label class="label">{{ isTodayReport ? 'Fecha' : 'Fecha Inicio' }}</label>
              <input v-model="fechaInicio" type="date" class="input" />
            </div>
            <div v-if="!isTodayReport" class="form-group">
              <label class="label">Fecha Fin</label>
              <input v-model="fechaFin" type="date" class="input" />
            </div>
          </div>
        </div>

        <div class="form-actions">
          <button
            @click="handleGenerate"
            class="btn btn-primary btn-lg"
            :disabled="!canGenerate || reportsStore.generating"
          >
            <span v-if="reportsStore.generating" class="material-symbols-outlined spinning">progress_activity</span>
            <span v-else class="material-symbols-outlined">file_download</span>
            {{ reportsStore.generating ? 'Generando...' : 'Generar Reporte PDF' }}
          </button>
        </div>

        <div v-if="reportsStore.error" class="error-msg">
          <span class="material-symbols-outlined">error</span>
          {{ reportsStore.error }}
        </div>
      </div>
    </div>

    <!-- Tab: Historial -->
    <div v-if="activeTab === 'historial'" class="history-section">
      <!-- Stats -->
      <div class="stats-grid">
        <div class="stat-card">
          <p class="stat-label">Total Reportes</p>
          <p class="stat-value">{{ stats.total }}</p>
        </div>
        <div class="stat-card">
          <p class="stat-label">Filtrados</p>
          <p class="stat-value stat-primary">{{ stats.filtered }}</p>
        </div>
        <div class="stat-card">
          <p class="stat-label">Tipos</p>
          <p class="stat-value stat-info">{{ stats.tipos }}</p>
        </div>
      </div>

      <!-- Filters -->
      <div class="card filters-card">
        <div class="filters-row">
          <div class="search-wrapper">
            <span class="material-symbols-outlined search-icon">search</span>
            <input
              v-model="searchQuery"
              type="text"
              placeholder="Buscar por usuario o tipo..."
              class="search-input"
            />
          </div>
          <select v-model="filterTipo" class="input filter-select">
            <option value="">Todos los tipos</option>
            <option v-for="tipo in reportsStore.tipos" :key="tipo.value" :value="tipo.value">
              {{ tipo.label }}
            </option>
          </select>
          <button @click="loadData" class="btn btn-secondary" :disabled="reportsStore.loading">
            <span class="material-symbols-outlined">refresh</span>
          </button>
        </div>
      </div>

      <!-- Loading -->
      <div v-if="reportsStore.loading" class="card loading-state">
        <span class="material-symbols-outlined spinning">progress_activity</span>
        <p>Cargando reportes...</p>
      </div>

      <!-- Error -->
      <div v-else-if="reportsStore.error" class="card error-state">
        <span class="material-symbols-outlined">error</span>
        <p>{{ reportsStore.error }}</p>
        <button @click="loadData" class="btn btn-primary btn-sm">Reintentar</button>
      </div>

      <!-- Table -->
      <div v-else class="card table-card">
        <div class="table-header">
          <h3 class="table-title">
            Reportes Generados
            <span v-if="filteredReports.length > 0" class="table-count">({{ filteredReports.length }})</span>
          </h3>
          <div v-if="totalPages > 1" class="pagination-info">
            Página {{ currentPage }} de {{ totalPages }}
          </div>
        </div>

        <div class="table-container">
          <table class="data-table">
            <thead>
              <tr>
                <th>Fecha</th>
                <th>Tipo</th>
                <th>Generado por</th>
                <th>Período</th>
                <th>Total</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="report in paginatedReports" :key="report.id">
                <td class="cell-date">{{ formatDate(report.creado_en) }}</td>
                <td>
                  <span class="tipo-badge">
                    <span class="material-symbols-outlined tipo-badge-icon">{{ getTipoIcon(report.tipo) }}</span>
                    {{ TIPO_LABELS[report.tipo] || report.tipo }}
                  </span>
                </td>
                <td>
                  <div class="cell-user">
                    <div class="mini-avatar">{{ report.usuario_nombre?.charAt(0) || '?' }}</div>
                    <div class="cell-user-info">
                      <span class="cell-name">{{ report.usuario_nombre }}</span>
                      <span class="cell-email">{{ report.usuario_email }}</span>
                    </div>
                  </div>
                </td>
                <td class="cell-muted">
                  {{ new Date(report.fecha_inicio).toLocaleDateString('es-BO') }}
                  <span v-if="report.fecha_inicio !== report.fecha_fin">
                    - {{ new Date(report.fecha_fin).toLocaleDateString('es-BO') }}
                  </span>
                </td>
                <td class="cell-total">{{ formatCurrency(report.total_generado) }}</td>
                <td>
                  <div class="action-btns">
                    <button @click="handleDownload(report.id)" class="btn-icon" title="Descargar PDF">
                      <span class="material-symbols-outlined">download</span>
                    </button>
                    <button @click="handleDelete(report.id)" class="btn-icon btn-icon-danger" title="Eliminar">
                      <span class="material-symbols-outlined">delete</span>
                    </button>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- Empty state -->
        <div v-if="filteredReports.length === 0" class="empty-state">
          <span class="material-symbols-outlined empty-icon">assignment</span>
          <p>No se encontraron reportes</p>
          <button @click="activeTab = 'generar'" class="btn btn-primary btn-sm mt-2">
            Generar primer reporte
          </button>
        </div>

        <!-- Pagination -->
        <div v-if="totalPages > 1" class="pagination">
          <button
            @click="currentPage = Math.max(1, currentPage - 1)"
            :disabled="currentPage === 1"
            class="btn btn-secondary btn-sm"
          >
            Anterior
          </button>
          <div class="pagination-pages">
            <button
              v-for="page in totalPages"
              :key="page"
              @click="currentPage = page"
              :class="['page-btn', { 'page-btn-active': page === currentPage }]"
            >
              {{ page }}
            </button>
          </div>
          <button
            @click="currentPage = Math.min(totalPages, currentPage + 1)"
            :disabled="currentPage === totalPages"
            class="btn btn-secondary btn-sm"
          >
            Siguiente
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.reports-page {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

/* Page Header */
.page-header {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.page-title {
  font-family: var(--font-headline);
  font-size: 1.5rem;
  font-weight: 600;
  color: var(--on-surface);
}

.page-subtitle {
  font-size: 0.875rem;
  color: var(--on-surface-variant);
}

/* Tabs */
.tabs {
  display: flex;
  gap: 0.25rem;
  background: var(--surface-container);
  border-radius: var(--radius-xl);
  padding: 0.25rem;
}

.tab {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  padding: 0.75rem 1rem;
  background: transparent;
  border: none;
  border-radius: var(--radius-lg);
  font-family: var(--font-label);
  font-size: 0.75rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.1em;
  color: var(--on-surface-variant);
  cursor: pointer;
  transition: all var(--transition-base);
}

.tab:hover {
  color: var(--on-surface);
  background: var(--surface-container-high);
}

.tab-active {
  background: var(--surface-container-lowest);
  color: var(--primary);
  box-shadow: var(--shadow-sm);
}

.tab-count {
  background: var(--primary);
  color: white;
  font-size: 0.625rem;
  padding: 0.125rem 0.5rem;
  border-radius: var(--radius-full);
  font-weight: 700;
}

/* Generate Section */
.generate-section {
  max-width: 48rem;
}

.generate-card {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.card-title {
  font-weight: 600;
  color: var(--on-surface);
}

.card-subtitle {
  font-size: 0.875rem;
  color: var(--on-surface-variant);
  margin-top: 0.25rem;
}

.form-grid {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.label {
  display: block;
  font-family: var(--font-label);
  font-size: 0.625rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.15em;
  color: var(--on-surface-variant);
  margin-left: 0.25rem;
}

.tipo-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 0.5rem;
}

@media (min-width: 640px) {
  .tipo-grid {
    grid-template-columns: repeat(5, 1fr);
  }
}

.tipo-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.5rem;
  padding: 1rem 0.5rem;
  background: var(--surface-container);
  border: 2px solid transparent;
  border-radius: var(--radius-xl);
  cursor: pointer;
  transition: all var(--transition-base);
  text-align: center;
}

.tipo-card:hover {
  background: var(--surface-container-high);
  border-color: var(--outline-variant);
}

.tipo-card-selected {
  background: rgba(0, 52, 43, 0.08);
  border-color: var(--primary);
}

.tipo-icon {
  font-size: 1.5rem;
  color: var(--primary);
}

.tipo-label {
  font-size: 0.6875rem;
  font-weight: 600;
  color: var(--on-surface);
  line-height: 1.2;
}

.date-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;
}

.input {
  width: 100%;
  padding: 0.75rem 1rem;
  background: var(--surface-container-lowest);
  border: 1px solid var(--outline-variant);
  border-radius: var(--radius);
  font-size: 0.875rem;
  color: var(--on-surface);
  transition: border-color var(--transition-base);
}

.input:focus {
  outline: none;
  border-color: var(--primary);
}

.form-actions {
  display: flex;
  justify-content: flex-end;
}

.btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  padding: 0.75rem 1.5rem;
  font-family: var(--font-label);
  font-size: 0.75rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.1em;
  border: none;
  border-radius: var(--radius-lg);
  cursor: pointer;
  transition: all var(--transition-base);
}

.btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.btn-primary {
  background: linear-gradient(135deg, var(--primary) 0%, var(--primary-container) 100%);
  color: white;
  box-shadow: 0 4px 14px rgba(0, 52, 43, 0.2);
}

.btn-primary:hover:not(:disabled) {
  transform: scale(1.01);
  box-shadow: 0 6px 20px rgba(0, 52, 43, 0.3);
}

.btn-secondary {
  background: var(--surface-container);
  color: var(--on-surface);
  border: 1px solid var(--outline-variant);
}

.btn-secondary:hover:not(:disabled) {
  background: var(--surface-container-high);
}

.btn-sm {
  padding: 0.5rem 1rem;
  font-size: 0.625rem;
}

.btn-lg {
  padding: 1rem 2rem;
  font-size: 0.875rem;
}

.error-msg {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1rem;
  background: rgba(239, 68, 68, 0.1);
  color: var(--error);
  border-radius: var(--radius-lg);
  font-size: 0.875rem;
}

.spinning {
  animation: spin 1s linear infinite;
}

/* Stats */
.stats-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 1rem;
}

.stat-card {
  background: var(--surface-container-lowest);
  border: 1px solid var(--outline-variant);
  border-radius: var(--radius-xl);
  padding: 1rem;
}

.stat-label {
  font-size: 0.875rem;
  color: var(--on-surface-variant);
}

.stat-value {
  font-size: 1.5rem;
  font-weight: 700;
  color: var(--on-surface);
}

.stat-primary { color: var(--primary); }
.stat-info { color: #3b82f6; }

/* Filters */
.filters-card {
  padding: 1rem 1.5rem;
}

.filters-row {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

@media (min-width: 640px) {
  .filters-row {
    flex-direction: row;
    align-items: center;
  }
}

.search-wrapper {
  flex: 1;
  position: relative;
}

.search-input {
  width: 100%;
  padding: 0.75rem 1rem 0.75rem 2.5rem;
  background: var(--surface-container);
  border: 1px solid var(--outline-variant);
  border-radius: var(--radius-lg);
  font-size: 0.875rem;
  color: var(--on-surface);
}

.search-input::placeholder { color: var(--on-surface-variant); }
.search-input:focus { outline: none; border-color: var(--primary); }

.search-icon {
  position: absolute;
  left: 0.75rem;
  top: 50%;
  transform: translateY(-50%);
  color: var(--on-surface-variant);
  font-size: 1.125rem;
}

.filter-select {
  width: auto;
  min-width: 180px;
  padding: 0.75rem 2.25rem 0.75rem 1rem;
  background: var(--surface-container);
  border: 1px solid var(--outline-variant);
  border-radius: var(--radius-lg);
  font-size: 0.875rem;
  color: var(--on-surface);
  cursor: pointer;
  appearance: none;
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='%236b7280' d='M6 8L1 3h10z'/%3E%3C/svg%3E");
  background-repeat: no-repeat;
  background-position: right 0.75rem center;
}

.filter-select:focus { outline: none; border-color: var(--primary); }

/* Loading & Error States */
.loading-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1rem;
  padding: 3rem;
  color: var(--on-surface-variant);
}

.loading-state .spinning {
  animation: spin 1s linear infinite;
  font-size: 2rem;
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

.error-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1rem;
  padding: 3rem;
  color: var(--error);
}

.error-state .material-symbols-outlined { font-size: 2rem; }

/* Table Card */
.table-card {
  overflow: hidden;
}

.table-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 1rem;
}

.table-title {
  font-weight: 600;
  color: var(--on-surface);
}

.table-count {
  font-weight: 400;
  color: var(--on-surface-variant);
  font-size: 0.875rem;
}

.pagination-info {
  font-size: 0.875rem;
  color: var(--on-surface-variant);
}

.table-container {
  overflow-x: auto;
}

.data-table {
  width: 100%;
  border-collapse: collapse;
}

.data-table th {
  padding: 0.75rem 1rem;
  font-size: 0.625rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.1em;
  color: var(--on-surface-variant);
  background: var(--surface-container);
  text-align: left;
  border-bottom: 1px solid var(--outline-variant);
  white-space: nowrap;
}

.data-table td {
  padding: 0.875rem 1rem;
  font-size: 0.8125rem;
  border-bottom: 1px solid var(--outline-variant);
  vertical-align: middle;
}

.data-table tbody tr:hover {
  background: var(--surface-container-low);
}

.cell-date {
  font-size: 0.75rem;
  color: var(--on-surface-variant);
  white-space: nowrap;
}

.cell-user {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.mini-avatar {
  width: 2rem;
  height: 2rem;
  border-radius: var(--radius-full);
  background: rgba(0, 52, 43, 0.1);
  color: var(--primary);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.75rem;
  font-weight: 700;
  flex-shrink: 0;
}

.cell-user-info {
  display: flex;
  flex-direction: column;
}

.cell-name {
  font-weight: 500;
  color: var(--on-surface);
  font-size: 0.8125rem;
}

.cell-email {
  font-size: 0.6875rem;
  color: var(--on-surface-variant);
}

.cell-muted {
  color: var(--on-surface-variant);
  font-size: 0.8125rem;
}

.cell-total {
  font-weight: 600;
  font-family: monospace;
  color: var(--primary);
  white-space: nowrap;
}

/* Tipo Badge */
.tipo-badge {
  display: inline-flex;
  align-items: center;
  gap: 0.375rem;
  padding: 0.25rem 0.5rem;
  font-size: 0.75rem;
  font-weight: 600;
  background: rgba(0, 52, 43, 0.08);
  color: var(--primary);
  border-radius: var(--radius-full);
  white-space: nowrap;
}

.tipo-badge-icon {
  font-size: 0.875rem;
}

/* Action Buttons */
.action-btns {
  display: flex;
  gap: 0.25rem;
}

.btn-icon {
  width: 2.25rem;
  height: 2.25rem;
  display: flex;
  align-items: center;
  justify-content: center;
  background: transparent;
  border: 1px solid var(--outline-variant);
  border-radius: var(--radius);
  color: var(--on-surface-variant);
  cursor: pointer;
  transition: all var(--transition-base);
}

.btn-icon:hover {
  background: var(--surface-container);
  color: var(--primary);
  border-color: var(--primary);
}

.btn-icon-danger:hover {
  color: var(--error);
  border-color: var(--error);
  background: rgba(239, 68, 68, 0.08);
}

.btn-icon .material-symbols-outlined {
  font-size: 1.125rem;
}

/* Empty State */
.empty-state {
  text-align: center;
  padding: 3rem;
}

.empty-icon {
  font-size: 4rem;
  color: var(--outline-variant);
  margin-bottom: 1rem;
}

.empty-state p {
  color: var(--on-surface-variant);
}

/* Pagination */
.pagination {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.75rem;
  padding-top: 1rem;
  margin-top: 1rem;
  border-top: 1px solid var(--outline-variant);
}

.pagination-pages {
  display: flex;
  gap: 0.25rem;
}

.page-btn {
  width: 2.25rem;
  height: 2.25rem;
  display: flex;
  align-items: center;
  justify-content: center;
  background: transparent;
  border: 1px solid var(--outline-variant);
  border-radius: var(--radius);
  font-size: 0.8125rem;
  color: var(--on-surface-variant);
  cursor: pointer;
  transition: all var(--transition-base);
}

.page-btn:hover {
  border-color: var(--primary);
  color: var(--primary);
}

.page-btn-active {
  background: var(--primary);
  border-color: var(--primary);
  color: white;
}

.mt-2 {
  margin-top: 0.5rem;
}

.card {
  background: var(--surface-container-lowest);
  border: 1px solid var(--outline-variant);
  border-radius: var(--radius-xl);
  padding: 1.5rem;
}
</style>
