<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRestaurantStore } from '@/stores/restaurant'
import { useAuthStore } from '@/stores/auth'
import { apiFetch } from '@/utils/api'

const store = useRestaurantStore()
const authStore = useAuthStore()

const userRole = computed(() => authStore.user?.rol || '')
const isAdmin = computed(() => userRole.value === 'admin')

const activeTab = ref('tables')
const showReservationModal = ref(false)

const reservationForm = ref({
  cliente_id: null,
  mesa_id: null,
  cantidad_personas: 2,
  fecha_reserva: '',
  hora_reserva: '19:00',
  observaciones: ''
})

const newCustomerForm = ref({
  nombre: '',
  telefono: '',
  email: ''
})
const showNewCustomerForm = ref(false)

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

const getReservationStatusInfo = (status) => {
  const info = {
    confirmada: { label: 'Confirmada', badgeClass: 'badge-success' },
    pendiente: { label: 'Pendiente', badgeClass: 'badge-warning' },
    cancelada: { label: 'Cancelada', badgeClass: 'badge-danger' },
    completada: { label: 'Completada', badgeClass: 'badge-info' },
    no_asistio: { label: 'No Asistio', badgeClass: 'badge-muted' }
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
  showTableModal.value = true
}

const saveTable = async () => {
  if (!tableForm.value.numero || tableForm.value.capacidad <= 0) {
    return
  }
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

const openReservationModal = () => {
  reservationForm.value = {
    cliente_id: null,
    mesa_id: null,
    cantidad_personas: 2,
    fecha_reserva: new Date().toISOString().split('T')[0],
    hora_reserva: '19:00',
    observaciones: ''
  }
  showNewCustomerForm.value = false
  showReservationModal.value = true
}

const createNewCustomer = async () => {
  if (!newCustomerForm.value.nombre || !newCustomerForm.value.telefono) {
    alert('Nombre y telefono son obligatorios')
    return
  }

  try {
    const result = await store.createCustomer({
      nombre: newCustomerForm.value.nombre,
      telefono: newCustomerForm.value.telefono,
      email: newCustomerForm.value.email || null
    })
    
    if (result && result.id) {
      reservationForm.value.cliente_id = result.id
      showNewCustomerForm.value = false
      newCustomerForm.value = { nombre: '', telefono: '', email: '' }
    }
  } catch (error) {
    alert('Error al crear cliente')
  }
}

const saveReservation = async () => {
  if (!reservationForm.value.mesa_id || !reservationForm.value.fecha_reserva || !reservationForm.value.hora_reserva) {
    alert('Mesa, fecha y hora son obligatorios')
    return
  }

  try {
    await store.createReservation({
      cliente_id: reservationForm.value.cliente_id || null,
      mesa_id: reservationForm.value.mesa_id,
      cantidad_personas: reservationForm.value.cantidad_personas,
      fecha_reserva: reservationForm.value.fecha_reserva,
      hora_reserva: reservationForm.value.hora_reserva,
      observaciones: reservationForm.value.observaciones || null
    })
    showReservationModal.value = false
    await store.loadTables()
  } catch (error) {
    console.error('Error creando reservacion:', error)
    alert(error.message || 'Error al crear reservacion')
  }
}

const confirmReservation = async (id) => {
  try {
    await store.updateReservationStatus(id, 'confirmada')
  } catch (error) {
    console.error('Error confirmando reservacion:', error)
    alert(error.message || 'Error al confirmar reservacion')
  }
}

const cancelReservation = async (id) => {
  try {
    await store.updateReservationStatus(id, 'cancelada')
  } catch (error) {
    console.error('Error cancelando reservacion:', error)
    alert(error.message || 'Error al cancelar reservacion')
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

const markNoShow = async (id) => {
  try {
    await store.updateReservationStatus(id, 'no_asistio')
  } catch (error) {
    console.error('Error marcando no asistio:', error)
    alert(error.message || 'Error al marcar no asistio')
  }
}

onMounted(async () => {
  await store.loadReservations()
  await store.loadTables()
  await store.loadCustomers()
})

const todayReservations = computed(() => {
  const today = new Date().toISOString().split('T')[0]
  return store.reservations.filter(r => r.fecha_reserva === today || r.estado === 'pendiente')
})
</script>

<template>
  <div class="tables-page">
    <!-- Header -->
    <div class="page-header">
      <div class="header-info">
        <h1 class="page-title">Mesas y Reservaciones</h1>
        <p class="page-subtitle">Gestiona el estado de las mesas y reservaciones</p>
      </div>
      <div class="header-actions">
        <button v-if="isAdmin" @click="openTableModal" class="btn btn-secondary">
          <span class="material-symbols-outlined">add</span>
          Nueva Mesa
        </button>
        <button @click="openReservationModal" class="btn btn-primary">
          <span class="material-symbols-outlined">add</span>
          Nueva Reservacion
        </button>
      </div>
    </div>
    
    <!-- Tabs -->
    <div class="tabs">
      <button
        @click="activeTab = 'tables'"
        :class="['tab-btn', { 'tab-btn-active': activeTab === 'tables' }]"
      >
        Mapa de Mesas
      </button>
      <button
        @click="activeTab = 'reservations'"
        :class="['tab-btn', { 'tab-btn-active': activeTab === 'reservations' }]"
      >
        Reservaciones
      </button>
    </div>
    
    <!-- Tables Tab -->
    <div v-if="activeTab === 'tables'" class="tables-content">
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
            <!-- Table Number -->
            <div class="table-visual">
              <div :class="['table-number', `table-number-${table.estado}`]">
                {{ table.numero }}
              </div>
            </div>
            
            <!-- Table Info -->
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
        
        <!-- Legend -->
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
    </div>
    
    <!-- Reservations Tab -->
    <div v-if="activeTab === 'reservations'" class="reservations-content">
      <div class="card">
        <h3 class="card-title">Reservaciones de Hoy y Pendientes</h3>
        
        <div v-if="todayReservations.length > 0" class="reservations-list">
          <div
            v-for="reservation in todayReservations"
            :key="reservation.id"
            class="reservation-card"
          >
            <div class="reservation-left">
              <div class="reservation-avatar">{{ (reservation.cliente_nombre || 'N').charAt(0) }}</div>
              <div class="reservation-info">
                <p class="reservation-name">{{ reservation.cliente_nombre || 'Sin nombre' }}</p>
                <div class="reservation-details">
                  <span v-if="reservation.cliente_telefono" class="detail-item">
                    <span class="material-symbols-outlined">call</span>
                    {{ reservation.cliente_telefono }}
                  </span>
                  <span class="detail-item">
                    <span class="material-symbols-outlined">group</span>
                    {{ reservation.cantidad_personas }} personas
                  </span>
                  <span class="detail-item">
                    <span class="material-symbols-outlined">schedule</span>
                    {{ reservation.fecha_reserva }} - {{ reservation.hora_reserva }}
                  </span>
                </div>
                <p v-if="reservation.observaciones" class="reservation-notes">{{ reservation.observaciones }}</p>
              </div>
            </div>
            
            <div class="reservation-right">
              <span :class="['badge', getReservationStatusInfo(reservation.estado).badgeClass]">
                {{ getReservationStatusInfo(reservation.estado).label }}
              </span>
              <div v-if="reservation.estado === 'pendiente'" class="reservation-actions">
                <button @click="confirmReservation(reservation.id)" class="btn btn-primary btn-sm">
                  Confirmar
                </button>
                <button @click="cancelReservation(reservation.id)" class="btn btn-secondary btn-sm">
                  Cancelar
                </button>
              </div>
              <div v-if="reservation.mesa_numero" class="reservation-table">
                Mesa {{ reservation.mesa_numero }}
              </div>
            </div>
          </div>
        </div>
        
        <div v-else class="empty-state">
          <span class="material-symbols-outlined empty-icon">calendar_month</span>
          <p>No hay reservaciones para hoy</p>
        </div>
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
            <div class="form-group">
              <label class="form-label">Numero de Mesa</label>
              <input v-model="tableForm.numero" type="text" class="input" placeholder="1, 2, A1, Terraza" required />
            </div>

            <div class="form-group">
              <label class="form-label">Capacidad</label>
              <input v-model="tableForm.capacidad" type="number" min="1" class="input" required />
            </div>

            <div class="modal-actions">
              <button type="button" @click="showTableModal = false" class="btn btn-secondary">Cancelar</button>
              <button type="submit" class="btn btn-primary">Crear Mesa</button>
            </div>
          </form>
        </div>
      </div>
    </Teleport>

    <!-- Reservation Modal -->
    <Teleport to="body">
      <div v-if="showReservationModal" class="modal-overlay">
        <div @click="showReservationModal = false" class="modal-backdrop"></div>
        <div class="modal-content">
          <div class="modal-header">
            <h2 class="modal-title">Nueva Reservacion</h2>
            <button @click="showReservationModal = false" class="modal-close">
              <span class="material-symbols-outlined">close</span>
            </button>
          </div>
          
          <form @submit.prevent="saveReservation" class="modal-form">
            <div class="form-group">
              <label class="form-label">Cliente</label>
              <div class="customer-selector">
                <select v-if="!showNewCustomerForm" v-model="reservationForm.cliente_id" class="input">
                  <option value="">Sin cliente</option>
                  <option v-for="customer in store.customers" :key="customer.id" :value="customer.id">
                    {{ customer.nombre }} ({{ customer.telefono }})
                  </option>
                </select>
                <div v-else class="new-customer-form">
                  <input v-model="newCustomerForm.nombre" type="text" class="input" placeholder="Nombre" />
                  <input v-model="newCustomerForm.telefono" type="text" class="input" placeholder="Telefono" />
                  <input v-model="newCustomerForm.email" type="email" class="input" placeholder="Email (opcional)" />
                  <button type="button" @click="createNewCustomer" class="btn btn-primary btn-sm">Crear</button>
                  <button type="button" @click="showNewCustomerForm = false" class="btn btn-secondary btn-sm">Cancelar</button>
                </div>
                <button v-if="!showNewCustomerForm" type="button" @click="showNewCustomerForm = true" class="btn btn-secondary btn-sm">+ Nuevo</button>
              </div>
            </div>

            <div class="form-group">
              <label class="form-label">Mesa</label>
              <select v-model="reservationForm.mesa_id" class="input" required>
                <option value="" disabled>Selecciona una mesa</option>
                <option v-for="table in store.tables" :key="table.id" :value="table.id">
                  Mesa {{ table.numero }} ({{ table.capacidad }} personas)
                </option>
              </select>
            </div>

            <div class="form-row-3">
              <div class="form-group">
                <label class="form-label">Personas</label>
                <input v-model="reservationForm.cantidad_personas" type="number" min="1" max="20" class="input" required />
              </div>
              <div class="form-group">
                <label class="form-label">Fecha</label>
                <input v-model="reservationForm.fecha_reserva" type="date" class="input" required />
              </div>
              <div class="form-group">
                <label class="form-label">Hora</label>
                <input v-model="reservationForm.hora_reserva" type="time" class="input" required />
              </div>
            </div>

            <div class="form-group">
              <label class="form-label">Notas</label>
              <textarea v-model="reservationForm.observaciones" class="input textarea" placeholder="Ocasion especial, preferencias, etc."></textarea>
            </div>
            
            <div class="modal-actions">
              <button type="button" @click="showReservationModal = false" class="btn btn-secondary">Cancelar</button>
              <button type="submit" class="btn btn-primary">Guardar Reservacion</button>
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

.tabs {
  display: flex;
  gap: 0.5rem;
  border-bottom: 1px solid var(--outline-variant);
}

.tab-btn {
  padding: 0.75rem 1rem;
  background: transparent;
  border: none;
  border-bottom: 2px solid transparent;
  margin-bottom: -1px;
  font-size: 0.875rem;
  font-weight: 500;
  color: var(--on-surface-variant);
  cursor: pointer;
  transition: all var(--transition-base);
}

.tab-btn:hover {
  color: var(--on-surface);
}

.tab-btn-active {
  color: var(--primary);
  border-bottom-color: var(--primary);
}

.tables-content {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
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

.action-buttons {
  display: flex;
  gap: 0.5rem;
  flex-wrap: wrap;
}

.reservations-content {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.reservations-list {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  margin-top: 1rem;
}

.reservation-card {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  padding: 1rem;
  background: var(--surface-container);
  border-radius: var(--radius-lg);
}

@media (min-width: 640px) {
  .reservation-card {
    flex-direction: row;
    align-items: center;
    justify-content: space-between;
  }
}

.reservation-left {
  display: flex;
  align-items: flex-start;
  gap: 1rem;
}

.reservation-avatar {
  width: 3rem;
  height: 3rem;
  border-radius: var(--radius-full);
  background: rgba(0, 52, 43, 0.1);
  color: var(--primary);
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 700;
  flex-shrink: 0;
}

.reservation-info {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.reservation-info .reservation-name {
  font-weight: 500;
  color: var(--on-surface);
}

.reservation-details {
  display: flex;
  flex-wrap: wrap;
  gap: 0.75rem;
}

.detail-item {
  display: flex;
  align-items: center;
  gap: 0.25rem;
  font-size: 0.875rem;
  color: var(--on-surface-variant);
}

.detail-item .material-symbols-outlined {
  font-size: 0.875rem;
}

.reservation-notes {
  font-size: 0.75rem;
  color: var(--primary);
  margin-top: 0.25rem;
}

.reservation-right {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 0.75rem;
}

@media (min-width: 640px) {
  .reservation-right {
    align-items: flex-end;
  }
}

.reservation-actions {
  display: flex;
  gap: 0.5rem;
}

.reservation-table {
  font-size: 0.875rem;
  color: var(--on-surface-variant);
}

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

.form-group {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.form-label {
  font-size: 0.75rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: var(--on-surface-variant);
}

.form-row-3 {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 1rem;
}

.textarea {
  min-height: 80px;
  resize: vertical;
}

.modal-actions {
  display: flex;
  gap: 0.75rem;
  margin-top: 1rem;
}

.modal-actions .btn {
  flex: 1;
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

.badge-info {
  background: rgba(59, 130, 246, 0.15);
  color: #3b82f6;
}

.badge-muted {
  background: rgba(112, 121, 117, 0.15);
  color: var(--outline);
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

.customer-selector {
  display: flex;
  gap: 0.5rem;
  align-items: center;
}

.customer-selector .input {
  flex: 1;
}

.new-customer-form {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 0.5rem;
}

.new-customer-form .input {
  width: 100%;
}

.new-customer-form button {
  padding: 0.5rem 0.75rem;
  font-size: 0.625rem;
}
</style>
