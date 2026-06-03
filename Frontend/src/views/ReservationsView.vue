<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRestaurantStore } from '@/stores/restaurant'
import { useAuthStore } from '@/stores/auth'
import { required, min, max } from '@/utils/validators'
import { useFormValidation } from '@/composables/useFormValidation'
import FormField from '@/components/FormField.vue'

const store = useRestaurantStore()
const authStore = useAuthStore()

const userRole = computed(() => authStore.user?.rol || '')
const isAdmin = computed(() => userRole.value === 'admin')

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

const { validateField: validateReservationField, touchField: touchReservationField, validateAll: validateReservation, getError: getReservationError, resetValidation: resetReservationValidation } = useFormValidation({
  cantidad_personas: {
    rules: [required(), min(1, 'Minimo 1 persona'), max(20, 'Maximo 20 personas')],
    value: computed(() => reservationForm.value.cantidad_personas)
  },
  fecha_reserva: {
    rules: [required('La fecha es obligatoria')],
    value: computed(() => reservationForm.value.fecha_reserva)
  },
  hora_reserva: {
    rules: [required('La hora es obligatoria')],
    value: computed(() => reservationForm.value.hora_reserva)
  }
})

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
  resetReservationValidation()
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
  if (!reservationForm.value.mesa_id) {
    alert('Debe seleccionar una mesa')
    return
  }
  if (!validateReservation()) return

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

const markNoShow = async (id) => {
  try {
    await store.updateReservationStatus(id, 'no_asistio')
  } catch (error) {
    console.error('Error marcando no asistio:', error)
    alert(error.message || 'Error al marcar no asistio')
  }
}

const todayReservations = computed(() => {
  const today = new Date().toISOString().split('T')[0]
  return store.reservations.filter(r => r.fecha_reserva === today || r.estado === 'pendiente')
})

const stats = computed(() => ({
  pendientes: store.reservations.filter(r => r.estado === 'pendiente').length,
  confirmadas: store.reservations.filter(r => r.estado === 'confirmada').length,
  completadas: store.reservations.filter(r => r.estado === 'completada').length,
  canceladas: store.reservations.filter(r => r.estado === 'cancelada').length
}))

onMounted(async () => {
  await store.loadReservations()
  await store.loadTables()
  await store.loadCustomers()
})
</script>

<template>
  <div class="reservations-page">
    <!-- Header -->
    <div class="page-header">
      <div class="header-info">
        <h1 class="page-title">Reservaciones</h1>
        <p class="page-subtitle">Gestiona las reservaciones del restaurante</p>
      </div>
      <div class="header-actions">
        <button @click="openReservationModal" class="btn btn-primary">
          <span class="material-symbols-outlined">add</span>
          Nueva Reservacion
        </button>
      </div>
    </div>

    <!-- Stats -->
    <div class="stats-grid">
      <div class="stat-card">
        <p class="stat-label">Pendientes</p>
        <p class="stat-value stat-warning">{{ stats.pendientes }}</p>
      </div>
      <div class="stat-card">
        <p class="stat-label">Confirmadas</p>
        <p class="stat-value stat-success">{{ stats.confirmadas }}</p>
      </div>
      <div class="stat-card">
        <p class="stat-label">Completadas</p>
        <p class="stat-value stat-info">{{ stats.completadas }}</p>
      </div>
      <div class="stat-card">
        <p class="stat-label">Canceladas</p>
        <p class="stat-value stat-danger">{{ stats.canceladas }}</p>
      </div>
    </div>

    <!-- Reservations List -->
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
                  <option :value="null">Sin cliente</option>
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
                <option :value="null" disabled>Selecciona una mesa</option>
                <option v-for="table in store.tables" :key="table.id" :value="table.id">
                  Mesa {{ table.numero }} ({{ table.capacidad }} personas)
                </option>
              </select>
            </div>

            <div class="form-row-3">
              <FormField
                v-model="reservationForm.cantidad_personas"
                label="Personas"
                type="number"
                min="1"
                max="20"
                required
                :error="getReservationError('cantidad_personas')"
                @blur="touchReservationField('cantidad_personas')"
              />
              <FormField
                v-model="reservationForm.fecha_reserva"
                label="Fecha"
                type="date"
                required
                :error="getReservationError('fecha_reserva')"
                @blur="touchReservationField('fecha_reserva')"
              />
              <FormField
                v-model="reservationForm.hora_reserva"
                label="Hora"
                type="time"
                required
                :error="getReservationError('hora_reserva')"
                @blur="touchReservationField('hora_reserva')"
              />
            </div>

            <FormField
              v-model="reservationForm.observaciones"
              label="Notas"
              type="textarea"
              placeholder="Ocasion especial, preferencias, etc."
            />

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
.reservations-page {
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
.stat-info { color: #3b82f6; }

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

.reservation-name {
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

.modal-actions {
  display: flex;
  gap: 0.75rem;
  margin-top: 1rem;
}

.modal-actions .btn {
  flex: 1;
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
</style>
