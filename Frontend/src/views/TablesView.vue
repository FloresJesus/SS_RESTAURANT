<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRestaurantStore } from '@/stores/restaurant'
import { useAuthStore } from '@/stores/auth'
import { apiFetch } from '@/utils/api'
import { required, isNumeric, min } from '@/utils/validators'
import { useFormValidation } from '@/composables/useFormValidation'
import FormField from '@/components/FormField.vue'

const store = useRestaurantStore()
const authStore = useAuthStore()

const userRole = computed(() => authStore.user?.rol || '')
const isAdmin = computed(() => userRole.value === 'admin')

const { validateField: validateTableField, touchField: touchTableField, validateAll: validateTable, getError: getTableError, resetValidation: resetTableValidation } = useFormValidation({
  numero: {
    rules: [required('El numero de mesa es obligatorio')],
    value: computed(() => tableForm.value.numero)
  },
  capacidad: {
    rules: [required(), isNumeric(), min(1, 'La capacidad minima es 1')],
    value: computed(() => tableForm.value.capacidad)
  }
})

const tableStats = computed(() => ({
  available: store.tables.filter(t => t.estado === 'libre').length,
  occupied: store.tables.filter(t => t.estado === 'ocupada').length,
  reserved: store.tables.filter(t => t.estado === 'mantenimiento').length,
  total: store.tables.length
}))

const getStatusInfo = (status) => {
  const info = {
    libre: { label: 'Libre', badgeClass: 'badge-success' },
    ocupada: { label: 'Ocupada', badgeClass: 'badge-danger' },
    mantenimiento: { label: 'Mantenimiento', badgeClass: 'badge-warning' }
  }
  return info[status] || { label: status, badgeClass: '' }
}

const updateTableStatus = async (tableId, newStatus) => {
  try {
    await store.updateTableStatus(tableId, newStatus)
  } catch (error) {
    console.error('Error actualizando estado de mesa:', error)
    alert(error.message || 'Error al actualizar estado')
  }
}

const showTableModal = ref(false)
const tableForm = ref({
  numero: '',
  capacidad: 2
})

const openTableModal = () => {
  tableForm.value = {
    numero: '',
    capacidad: 2
  }
  resetTableValidation()
  showTableModal.value = true
}

const saveTable = async () => {
  if (!validateTable()) return
  try {
    await store.createTable({
      numero: tableForm.value.numero,
      capacidad: Number(tableForm.value.capacidad)
    })
    showTableModal.value = false
  } catch (error) {
    console.error('Error creando mesa:', error)
    alert(error.message || 'Error al crear mesa')
  }
}

const deleteTable = async (id) => {
  if (!confirm('¿Estás seguro de eliminar esta mesa?')) return
  try {
    await apiFetch(`/api/tables/${id}`, { method: 'DELETE' })
    await store.loadTables()
  } catch (error) {
    alert(error.message || 'Error al eliminar mesa')
  }
}

onMounted(async () => {
  await store.loadTables()
})
</script>

<template>
  <div class="tables-page">
    <!-- Header -->
    <div class="page-header">
      <div class="header-info">
        <h1 class="page-title">Mesas</h1>
        <p class="page-subtitle">Gestiona el estado y disposicion de las mesas</p>
      </div>
      <div class="header-actions">
        <button v-if="isAdmin" @click="openTableModal" class="btn btn-secondary">
          <span class="material-symbols-outlined">add</span>
          Nueva Mesa
        </button>
      </div>
    </div>

    <!-- Stats -->
    <div class="stats-grid">
      <div class="stat-card">
        <p class="stat-label">Total Mesas</p>
        <p class="stat-value">{{ tableStats.total }}</p>
      </div>
      <div class="stat-card">
        <p class="stat-label">Libres</p>
        <p class="stat-value stat-success">{{ tableStats.available }}</p>
      </div>
      <div class="stat-card">
        <p class="stat-label">Ocupadas</p>
        <p class="stat-value stat-danger">{{ tableStats.occupied }}</p>
      </div>
      <div class="stat-card">
        <p class="stat-label">Mantenimiento</p>
        <p class="stat-value stat-warning">{{ tableStats.reserved }}</p>
      </div>
    </div>

    <!-- Tables Grid -->
    <div class="card">
      <h3 class="card-title">Mapa del Restaurante</h3>
      <div class="tables-grid">
        <div
          v-for="table in store.tables"
          :key="table.id"
          :class="['table-card', `table-card-${table.estado}`]"
        >
          <div class="table-visual">
            <div :class="['table-number', `table-number-${table.estado}`]">
              {{ table.numero }}
            </div>
          </div>

          <div class="table-info">
            <p class="table-name">Mesa {{ table.numero }}</p>
            <div class="table-capacity">
              <span class="material-symbols-outlined">group</span>
              {{ table.capacidad }} personas
            </div>
            <span :class="['badge', getStatusInfo(table.estado).badgeClass]">
              {{ getStatusInfo(table.estado).label }}
            </span>
          </div>
        </div>
      </div>

      <div class="tables-legend">
        <div class="legend-item">
          <span class="legend-dot legend-dot-success"></span>
          <span>Libre</span>
        </div>
        <div class="legend-item">
          <span class="legend-dot legend-dot-danger"></span>
          <span>Ocupada</span>
        </div>
        <div class="legend-item">
          <span class="legend-dot legend-dot-warning"></span>
          <span>Mantenimiento</span>
        </div>
      </div>
    </div>

    <!-- Quick Status Update -->
    <div class="card">
      <h3 class="card-title">Actualizar Estado Rapido</h3>
      <div class="table-container">
        <table class="data-table">
          <thead>
            <tr>
              <th>Mesa</th>
              <th>Capacidad</th>
              <th>Estado</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="table in store.tables" :key="table.id">
              <td class="cell-bold">Mesa {{ table.numero }}</td>
              <td class="cell-muted">{{ table.capacidad }} personas</td>
              <td>
                <span :class="['badge', getStatusInfo(table.estado).badgeClass]">
                  {{ getStatusInfo(table.estado).label }}
                </span>
              </td>
              <td>
                <div class="action-buttons">
                  <button
                    @click="updateTableStatus(table.id, 'libre')"
                    :disabled="table.estado === 'libre'"
                    :class="['action-btn', table.estado === 'libre' ? 'action-btn-active-success' : '']"
                  >
                    Liberar
                  </button>
                  <button
                    @click="updateTableStatus(table.id, 'ocupada')"
                    :disabled="table.estado === 'ocupada'"
                    :class="['action-btn', table.estado === 'ocupada' ? 'action-btn-active-danger' : '']"
                  >
                    Ocupar
                  </button>
                  <button
                    @click="updateTableStatus(table.id, 'mantenimiento')"
                    :disabled="table.estado === 'mantenimiento'"
                    :class="['action-btn', table.estado === 'mantenimiento' ? 'action-btn-active-warning' : '']"
                  >
                    Mantenimiento
                  </button>
                  <button
                    v-if="isAdmin"
                    @click="deleteTable(table.id)"
                    class="action-btn action-btn-delete"
                  >
                    Eliminar
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Table Modal -->
    <Teleport to="body">
      <div v-if="showTableModal" class="modal-overlay">
        <div @click="showTableModal = false" class="modal-backdrop"></div>
        <div class="modal-content">
          <div class="modal-header">
            <h2 class="modal-title">Nueva Mesa</h2>
            <button @click="showTableModal = false" class="modal-close">
              <span class="material-symbols-outlined">close</span>
            </button>
          </div>

          <form @submit.prevent="saveTable" class="modal-form">
            <FormField
              v-model="tableForm.numero"
              label="Número de Mesa"
              placeholder="Ej: 1, A1, Terraza"
              required
              :error="getTableError('numero')"
              @blur="touchTableField('numero')"
            />

            <FormField
              v-model="tableForm.capacidad"
              label="Capacidad"
              type="number"
              min="1"
              required
              :error="getTableError('capacidad')"
              @blur="touchTableField('capacidad')"
            />

            <div class="modal-actions">
              <button type="button" @click="showTableModal = false" class="btn btn-secondary">Cancelar</button>
              <button type="submit" class="btn btn-primary">Crear Mesa</button>
            </div>
          </form>
        </div>
      </div>
    </Teleport>
  </div>
</template>

<style scoped>
.tables-page {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

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

.header-actions {
  display: flex;
  gap: 0.75rem;
}

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

.stat-success { color: var(--success); }
.stat-danger { color: var(--danger); }
.stat-warning { color: var(--warning); }

.tables-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 1rem;
  margin-top: 1rem;
}

@media (min-width: 640px) {
  .tables-grid {
    grid-template-columns: repeat(3, 1fr);
  }
}

@media (min-width: 768px) {
  .tables-grid {
    grid-template-columns: repeat(4, 1fr);
  }
}

@media (min-width: 1024px) {
  .tables-grid {
    grid-template-columns: repeat(6, 1fr);
  }
}

.table-card {
  position: relative;
  padding: 1rem;
  border-radius: var(--radius-xl);
  border: 2px solid;
  cursor: pointer;
  transition: all var(--transition-base);
}

.table-card-libre {
  border-color: rgba(34, 197, 94, 0.5);
  background: rgba(34, 197, 94, 0.05);
}

.table-card-libre:hover {
  background: rgba(34, 197, 94, 0.1);
}

.table-card-ocupada {
  border-color: rgba(239, 68, 68, 0.5);
  background: rgba(239, 68, 68, 0.05);
}

.table-card-mantenimiento {
  border-color: rgba(245, 158, 11, 0.5);
  background: rgba(245, 158, 11, 0.05);
}

.table-visual {
  text-align: center;
  margin-bottom: 0.75rem;
}

.table-number {
  width: 3.5rem;
  height: 3.5rem;
  border-radius: var(--radius-full);
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto;
  font-size: 1.25rem;
  font-weight: 700;
}

.table-number-libre {
  background: rgba(34, 197, 94, 0.2);
  color: var(--success);
}

.table-number-ocupada {
  background: rgba(239, 68, 68, 0.2);
  color: var(--danger);
}

.table-number-mantenimiento {
  background: rgba(245, 158, 11, 0.2);
  color: var(--warning);
}

.table-info {
  text-align: center;
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
  align-items: center;
}

.table-name {
  font-size: 0.875rem;
  font-weight: 500;
  color: var(--on-surface);
}

.table-capacity {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.25rem;
  font-size: 0.75rem;
  color: var(--on-surface-variant);
}

.table-capacity .material-symbols-outlined {
  font-size: 0.875rem;
}

.tables-legend {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 1.5rem;
  margin-top: 1.5rem;
  padding-top: 1rem;
  border-top: 1px solid var(--outline-variant);
}

.legend-item {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.875rem;
  color: var(--on-surface-variant);
}

.legend-dot {
  width: 0.75rem;
  height: 0.75rem;
  border-radius: var(--radius-full);
}

.legend-dot-success { background: var(--success); }
.legend-dot-danger { background: var(--danger); }
.legend-dot-warning { background: var(--warning); }

.table-container {
  overflow-x: auto;
  margin-top: 1rem;
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
}

.data-table td {
  padding: 1rem;
  font-size: 0.875rem;
  border-bottom: 1px solid var(--outline-variant);
}

.data-table tbody tr:hover {
  background: var(--surface-container-low);
}

.cell-bold {
  font-weight: 500;
  color: var(--on-surface);
}

.cell-muted {
  color: var(--on-surface-variant);
}

.action-buttons {
  display: flex;
  gap: 0.5rem;
  flex-wrap: wrap;
}

.action-btn {
  padding: 0.375rem 0.75rem;
  background: var(--surface-container-high);
  border: none;
  border-radius: var(--radius);
  font-size: 0.75rem;
  font-weight: 500;
  color: var(--on-surface-variant);
  cursor: pointer;
  transition: all var(--transition-base);
}

.action-btn:hover:not(:disabled) {
  color: var(--on-surface);
}

.action-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.action-btn-active-success {
  background: rgba(34, 197, 94, 0.2);
  color: var(--success);
}

.action-btn-active-danger {
  background: rgba(239, 68, 68, 0.2);
  color: var(--error);
}

.action-btn-active-warning {
  background: rgba(245, 158, 11, 0.2);
  color: #f59e0b;
}

.action-btn-delete {
  color: var(--error);
}

.action-btn-delete:hover {
  background: rgba(239, 68, 68, 0.1);
}

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

.btn .material-symbols-outlined {
  font-size: 1rem;
}

.btn-primary {
  background: linear-gradient(135deg, var(--primary) 0%, var(--primary-container) 100%);
  color: white;
}

.btn-primary:hover {
  transform: scale(1.01);
}

.btn-secondary {
  background: var(--surface-container);
  color: var(--on-surface);
  border: 1px solid var(--outline-variant);
}

.btn-secondary:hover {
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

.card-title {
  font-weight: 600;
  color: var(--on-surface);
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

.input::placeholder {
  color: var(--outline);
}

.modal-overlay {
  position: fixed;
  inset: 0;
  z-index: 50;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 1rem;
}

.modal-backdrop {
  position: absolute;
  inset: 0;
  background: rgba(0, 0, 0, 0.6);
}

.modal-content {
  position: relative;
  background: var(--surface-container-lowest);
  border: 1px solid var(--outline-variant);
  border-radius: var(--radius-2xl);
  width: 100%;
  max-width: 32rem;
  padding: 1.5rem;
}

.modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 1.5rem;
}

.modal-title {
  font-family: var(--font-headline);
  font-size: 1.25rem;
  font-weight: 600;
  color: var(--on-surface);
}

.modal-close {
  padding: 0.5rem;
  background: transparent;
  border: none;
  color: var(--on-surface-variant);
  cursor: pointer;
  border-radius: var(--radius);
  transition: color var(--transition-base);
}

.modal-close:hover {
  color: var(--on-surface);
}

.modal-form {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.modal-actions {
  display: flex;
  gap: 0.75rem;
  margin-top: 1rem;
}

.modal-actions .btn {
  flex: 1;
}
</style>
