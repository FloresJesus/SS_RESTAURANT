<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useAuditStore } from '@/stores/audit'

const auditStore = useAuditStore()

const searchQuery = ref('')
const filterAccion = ref('')
const filterTabla = ref('')
const currentPage = ref(1)
const pageSize = 20

const filteredEntries = computed(() => {
  const searchText = searchQuery.value.toLowerCase()
  return auditStore.entries.filter(entry => {
    if (filterAccion.value && entry.accion !== filterAccion.value) return false
    if (filterTabla.value && entry.tabla !== filterTabla.value) return false
    if (searchText) {
      return (
        entry.usuario_nombre.toLowerCase().includes(searchText) ||
        entry.usuario_email.toLowerCase().includes(searchText) ||
        entry.accion.toLowerCase().includes(searchText) ||
        entry.tabla.toLowerCase().includes(searchText) ||
        (entry.detalle && entry.detalle.toLowerCase().includes(searchText))
      )
    }
    return true
  })
})

const totalPages = computed(() => Math.max(1, Math.ceil(filteredEntries.value.length / pageSize)))

const paginatedEntries = computed(() => {
  const start = (currentPage.value - 1) * pageSize
  return filteredEntries.value.slice(start, start + pageSize)
})

const stats = computed(() => ({
  total: auditStore.entries.length,
  filtered: filteredEntries.value.length,
  acciones: auditStore.uniqueAcciones.length,
  tablas: auditStore.uniqueTablas.length
}))

const getAccionBadge = (accion: string) => {
  const badges: Record<string, string> = {
    CREAR: 'badge-success',
    ACTUALIZAR: 'badge-warning',
    ELIMINAR: 'badge-danger',
    LOGIN: 'badge-info',
    LOGOUT: 'badge-muted'
  }
  return badges[accion] || 'badge-primary'
}

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

const loadAudit = async () => {
  currentPage.value = 1
  await auditStore.fetchAudit()
}

onMounted(loadAudit)
</script>

<template>
  <div class="audit-page">
    <!-- Header -->
    <div class="page-header">
      <div class="header-info">
        <h1 class="page-title">Auditoria del Sistema</h1>
        <p class="page-subtitle">Registro detallado de acciones realizadas por los usuarios</p>
      </div>
      <button @click="loadAudit" class="btn btn-primary" :disabled="auditStore.loading">
        <span class="material-symbols-outlined">refresh</span>
        Actualizar
      </button>
    </div>

    <!-- Stats -->
    <div class="stats-grid">
      <div class="stat-card">
        <p class="stat-label">Total Registros</p>
        <p class="stat-value">{{ stats.total }}</p>
      </div>
      <div class="stat-card">
        <p class="stat-label">Filtrados</p>
        <p class="stat-value stat-primary">{{ stats.filtered }}</p>
      </div>
      <div class="stat-card">
        <p class="stat-label">Acciones</p>
        <p class="stat-value stat-info">{{ stats.acciones }}</p>
      </div>
      <div class="stat-card">
        <p class="stat-label">Tablas</p>
        <p class="stat-value stat-warning">{{ stats.tablas }}</p>
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
            placeholder="Buscar por usuario, accion, tabla o detalle..."
            class="search-input"
          />
        </div>
        <div class="filter-selects">
          <select v-model="filterAccion" class="input filter-select">
            <option value="">Todas las acciones</option>
            <option v-for="accion in auditStore.uniqueAcciones" :key="accion" :value="accion">
              {{ accion }}
            </option>
          </select>
          <select v-model="filterTabla" class="input filter-select">
            <option value="">Todas las tablas</option>
            <option v-for="tabla in auditStore.uniqueTablas" :key="tabla" :value="tabla">
              {{ tabla }}
            </option>
          </select>
        </div>
      </div>
    </div>

    <!-- Loading -->
    <div v-if="auditStore.loading" class="card loading-state">
      <span class="material-symbols-outlined spinning">progress_activity</span>
      <p>Cargando registros de auditoria...</p>
    </div>

    <!-- Error -->
    <div v-else-if="auditStore.error" class="card error-state">
      <span class="material-symbols-outlined">error</span>
      <p>{{ auditStore.error }}</p>
      <button @click="loadAudit" class="btn btn-primary btn-sm">Reintentar</button>
    </div>

    <!-- Table -->
    <div v-else class="card table-card">
      <div class="table-header">
        <h3 class="table-title">
          Registros de Auditoria
          <span v-if="filteredEntries.length > 0" class="table-count">({{ filteredEntries.length }})</span>
        </h3>
        <div class="pagination-info" v-if="totalPages > 1">
          Pagina {{ currentPage }} de {{ totalPages }}
        </div>
      </div>

      <div class="table-container">
        <table class="data-table">
          <thead>
            <tr>
              <th>Fecha</th>
              <th>Usuario</th>
              <th>Accion</th>
              <th>Tabla</th>
              <th>ID</th>
              <th>Detalle</th>
              <th>IP</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="entry in paginatedEntries" :key="entry.id">
              <td class="cell-date">{{ formatDate(entry.creado_en) }}</td>
              <td>
                <div class="cell-user">
                  <div class="mini-avatar">{{ entry.usuario_nombre.charAt(0) }}</div>
                  <div class="cell-user-info">
                    <span class="cell-name">{{ entry.usuario_nombre }}</span>
                    <span class="cell-email">{{ entry.usuario_email }}</span>
                  </div>
                </div>
              </td>
              <td>
                <span :class="['badge', getAccionBadge(entry.accion)]">{{ entry.accion }}</span>
              </td>
              <td class="cell-muted">{{ entry.tabla }}</td>
              <td class="cell-muted">
                <span v-if="entry.registro_id" class="cell-id">#{{ entry.registro_id }}</span>
                <span v-else class="cell-none">-</span>
              </td>
              <td class="cell-detail">
                <span v-if="entry.detalle" class="detail-text">{{ entry.detalle }}</span>
                <span v-else class="cell-none">-</span>
              </td>
              <td class="cell-muted cell-ip">{{ entry.direccion_ip || '-' }}</td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Empty state -->
      <div v-if="filteredEntries.length === 0" class="empty-state">
        <span class="material-symbols-outlined empty-icon">history</span>
        <p>No se encontraron registros de auditoria</p>
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
</template>

<style scoped>
.audit-page {
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

@media (min-width: 640px) {
  .page-header {
    flex-direction: row;
    align-items: center;
    justify-content: space-between;
  }
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

/* Stats */
.stats-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 1rem;
}

@media (min-width: 640px) {
  .stats-grid {
    grid-template-columns: repeat(4, 1fr);
  }
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
.stat-warning { color: var(--warning); }

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

.search-input::placeholder {
  color: var(--on-surface-variant);
}

.search-input:focus {
  outline: none;
  border-color: var(--primary);
}

.search-icon {
  position: absolute;
  left: 0.75rem;
  top: 50%;
  transform: translateY(-50%);
  color: var(--on-surface-variant);
  font-size: 1.125rem;
}

.filter-selects {
  display: flex;
  gap: 0.75rem;
}

.filter-select {
  width: auto;
  min-width: 160px;
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

.filter-select:focus {
  outline: none;
  border-color: var(--primary);
}

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

.error-state .material-symbols-outlined {
  font-size: 2rem;
}

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

.cell-id {
  font-family: monospace;
  color: var(--on-surface);
}

.cell-none {
  color: var(--outline);
}

.cell-detail {
  max-width: 320px;
}

.detail-text {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  color: var(--on-surface);
  font-size: 0.8125rem;
  line-height: 1.4;
}

.cell-ip {
  font-family: monospace;
  font-size: 0.75rem;
}

/* Badges */
.badge {
  display: inline-flex;
  padding: 0.25rem 0.5rem;
  font-size: 0.625rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  border-radius: var(--radius-full);
}

.badge-success {
  background: rgba(34, 197, 94, 0.15);
  color: var(--success);
}

.badge-warning {
  background: rgba(245, 158, 11, 0.15);
  color: var(--warning);
}

.badge-danger {
  background: rgba(239, 68, 68, 0.15);
  color: var(--danger);
}

.badge-info {
  background: rgba(59, 130, 246, 0.15);
  color: #3b82f6;
}

.badge-muted {
  background: rgba(112, 121, 117, 0.15);
  color: var(--outline);
}

.badge-primary {
  background: rgba(0, 52, 43, 0.15);
  color: var(--primary);
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

/* Buttons */
.btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  padding: 0.75rem 1.5rem;
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
  opacity: 0.6;
  cursor: not-allowed;
}

.btn .material-symbols-outlined {
  font-size: 1rem;
}

.btn-primary {
  background: linear-gradient(135deg, var(--primary) 0%, var(--primary-container) 100%);
  color: white;
}

.btn-primary:hover:not(:disabled) {
  transform: scale(1.01);
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
  padding: 0.5rem 0.75rem;
  font-size: 0.625rem;
}

.card {
  background: var(--surface-container-lowest);
  border: 1px solid var(--outline-variant);
  border-radius: var(--radius-xl);
  padding: 1.5rem;
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
  box-sizing: border-box;
}

.input:focus {
  outline: none;
  border-color: var(--primary);
}

.input::placeholder {
  color: var(--outline);
}
</style>
