<script setup>
import { ref, computed } from 'vue'
import { useRestaurantStore } from '@/stores/restaurant'

const store = useRestaurantStore()

const activeTab = ref('tables')
const showReservationModal = ref(false)

const reservationForm = ref({
  name: '',
  phone: '',
  guests: 2,
  date: '',
  time: '',
  notes: ''
})

const tableStats = computed(() => ({
  available: store.tables.filter(t => t.status === 'available').length,
  occupied: store.tables.filter(t => t.status === 'occupied').length,
  reserved: store.tables.filter(t => t.status === 'reserved').length,
  total: store.tables.length
}))

const getStatusInfo = (status) => {
  const info = {
    available: { label: 'Disponible', badgeClass: 'badge-success' },
    occupied: { label: 'Ocupada', badgeClass: 'badge-danger' },
    reserved: { label: 'Reservada', badgeClass: 'badge-warning' }
  }
  return info[status] || { label: status, badgeClass: '' }
}

const getReservationStatusInfo = (status) => {
  const info = {
    confirmed: { label: 'Confirmada', badgeClass: 'badge-success' },
    pending: { label: 'Pendiente', badgeClass: 'badge-warning' },
    cancelled: { label: 'Cancelada', badgeClass: 'badge-danger' }
  }
  return info[status] || { label: status, badgeClass: '' }
}

const updateTableStatus = (tableId, newStatus) => {
  store.updateTableStatus(tableId, newStatus)
}

const openReservationModal = () => {
  reservationForm.value = {
    name: '',
    phone: '',
    guests: 2,
    date: new Date().toISOString().split('T')[0],
    time: '19:00',
    notes: ''
  }
  showReservationModal.value = true
}

const saveReservation = () => {
  store.addReservation({ ...reservationForm.value })
  showReservationModal.value = false
}

const confirmReservation = (id) => {
  store.updateReservation(id, { status: 'confirmed' })
}

const cancelReservation = (id) => {
  store.updateReservation(id, { status: 'cancelled' })
}

const todayReservations = computed(() => {
  const today = new Date().toISOString().split('T')[0]
  return store.reservations.filter(r => r.date === today || r.status === 'pending')
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
      <button @click="openReservationModal" class="btn btn-primary">
        <span class="material-symbols-outlined">add</span>
        Nueva Reservacion
      </button>
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
          <p class="stat-label">Disponibles</p>
          <p class="stat-value stat-success">{{ tableStats.available }}</p>
        </div>
        <div class="stat-card">
          <p class="stat-label">Ocupadas</p>
          <p class="stat-value stat-danger">{{ tableStats.occupied }}</p>
        </div>
        <div class="stat-card">
          <p class="stat-label">Reservadas</p>
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
            :class="['table-card', `table-card-${table.status}`]"
          >
            <!-- Table Number -->
            <div class="table-visual">
              <div :class="['table-number', `table-number-${table.status}`]">
                {{ table.number }}
              </div>
            </div>
            
            <!-- Table Info -->
            <div class="table-info">
              <p class="table-name">Mesa {{ table.number }}</p>
              <div class="table-capacity">
                <span class="material-symbols-outlined">group</span>
                {{ table.capacity }} personas
              </div>
              <span :class="['badge', getStatusInfo(table.status).badgeClass]">
                {{ getStatusInfo(table.status).label }}
              </span>
            </div>
            
            <!-- Reservation Info -->
            <div v-if="table.reservation" class="table-reservation">
              <p class="reservation-name">{{ table.reservation.name }}</p>
              <p class="reservation-detail">{{ table.reservation.time }} - {{ table.reservation.guests }} personas</p>
            </div>
          </div>
        </div>
        
        <!-- Legend -->
        <div class="tables-legend">
          <div class="legend-item">
            <span class="legend-dot legend-dot-success"></span>
            <span>Disponible</span>
          </div>
          <div class="legend-item">
            <span class="legend-dot legend-dot-danger"></span>
            <span>Ocupada</span>
          </div>
          <div class="legend-item">
            <span class="legend-dot legend-dot-warning"></span>
            <span>Reservada</span>
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
                <td class="cell-bold">Mesa {{ table.number }}</td>
                <td class="cell-muted">{{ table.capacity }} personas</td>
                <td>
                  <span :class="['badge', getStatusInfo(table.status).badgeClass]">
                    {{ getStatusInfo(table.status).label }}
                  </span>
                </td>
                <td>
                  <div class="action-buttons">
                    <button 
                      @click="updateTableStatus(table.id, 'available')"
                      :disabled="table.status === 'available'"
                      :class="['action-btn', table.status === 'available' ? 'action-btn-active-success' : '']"
                    >
                      Liberar
                    </button>
                    <button 
                      @click="updateTableStatus(table.id, 'occupied')"
                      :disabled="table.status === 'occupied'"
                      :class="['action-btn', table.status === 'occupied' ? 'action-btn-active-danger' : '']"
                    >
                      Ocupar
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
              <div class="reservation-avatar">{{ reservation.name.charAt(0) }}</div>
              <div class="reservation-info">
                <p class="reservation-name">{{ reservation.name }}</p>
                <div class="reservation-details">
                  <span class="detail-item">
                    <span class="material-symbols-outlined">call</span>
                    {{ reservation.phone }}
                  </span>
                  <span class="detail-item">
                    <span class="material-symbols-outlined">group</span>
                    {{ reservation.guests }} personas
                  </span>
                  <span class="detail-item">
                    <span class="material-symbols-outlined">schedule</span>
                    {{ reservation.date }} - {{ reservation.time }}
                  </span>
                </div>
                <p v-if="reservation.notes" class="reservation-notes">{{ reservation.notes }}</p>
              </div>
            </div>
            
            <div class="reservation-right">
              <span :class="['badge', getReservationStatusInfo(reservation.status).badgeClass]">
                {{ getReservationStatusInfo(reservation.status).label }}
              </span>
              <div v-if="reservation.status === 'pending'" class="reservation-actions">
                <button @click="confirmReservation(reservation.id)" class="btn btn-primary btn-sm">
                  Confirmar
                </button>
                <button @click="cancelReservation(reservation.id)" class="btn btn-secondary btn-sm">
                  Cancelar
                </button>
              </div>
              <div v-if="reservation.table" class="reservation-table">
                Mesa {{ reservation.table }}
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
              <label class="form-label">Nombre del Cliente</label>
              <input v-model="reservationForm.name" type="text" class="input" placeholder="Nombre completo" required />
            </div>
            
            <div class="form-group">
              <label class="form-label">Telefono</label>
              <input v-model="reservationForm.phone" type="tel" class="input" placeholder="555-1234" required />
            </div>
            
            <div class="form-row-3">
              <div class="form-group">
                <label class="form-label">Personas</label>
                <input v-model="reservationForm.guests" type="number" min="1" max="20" class="input" required />
              </div>
              <div class="form-group">
                <label class="form-label">Fecha</label>
                <input v-model="reservationForm.date" type="date" class="input" required />
              </div>
              <div class="form-group">
                <label class="form-label">Hora</label>
                <input v-model="reservationForm.time" type="time" class="input" required />
              </div>
            </div>
            
            <div class="form-group">
              <label class="form-label">Notas</label>
              <textarea v-model="reservationForm.notes" class="input textarea" placeholder="Ocasion especial, preferencias, etc."></textarea>
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

/* Tabs */
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

/* Tables Content */
.tables-content {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

/* Stats Grid */
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

/* Tables Grid */
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

.table-card-available {
  border-color: rgba(34, 197, 94, 0.5);
  background: rgba(34, 197, 94, 0.05);
}

.table-card-available:hover {
  background: rgba(34, 197, 94, 0.1);
}

.table-card-occupied {
  border-color: rgba(239, 68, 68, 0.5);
  background: rgba(239, 68, 68, 0.05);
}

.table-card-reserved {
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

.table-number-available {
  background: rgba(34, 197, 94, 0.2);
  color: var(--success);
}

.table-number-occupied {
  background: rgba(239, 68, 68, 0.2);
  color: var(--danger);
}

.table-number-reserved {
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

.table-reservation {
  margin-top: 0.75rem;
  padding-top: 0.75rem;
  border-top: 1px solid var(--outline-variant);
  text-align: center;
}

.table-reservation .reservation-name {
  font-size: 0.75rem;
  font-weight: 500;
  color: var(--on-surface);
}

.table-reservation .reservation-detail {
  font-size: 0.625rem;
  color: var(--on-surface-variant);
}

/* Legend */
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

/* Data Table */
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
  color: var(--danger);
}

/* Reservations */
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

/* Modal */
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

/* Form */
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

/* Card */
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

/* Input */
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
</style>
