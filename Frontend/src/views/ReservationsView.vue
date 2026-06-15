<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRestaurantStore } from '@/stores/restaurant'
import { useAuthStore } from '@/stores/auth'
import { useUsersStore } from '@/stores/users'
import { required, min, max } from '@/utils/validators'
import { useFormValidation } from '@/composables/useFormValidation'
import FormField from '@/components/FormField.vue'

const store = useRestaurantStore()
const authStore = useAuthStore()
const usersStore = useUsersStore()

const userRole = computed(() => authStore.user?.rol || '')
const isAdmin = computed(() => userRole.value === 'admin')

const showReservationModal = ref(false)
const showConvertModal = ref(false)
const convertingReservation = ref(null)

const reservationForm = ref({
  cliente_id: null,
  mesa_id: null,
  cantidad_personas: 2,
  fecha: '',
  hora_inicio: '19:00',
  duracion: 120,
  observaciones: ''
})

const convertForm = ref({
  mesero_id: authStore.user?.id || null,
  observaciones: '',
  metodo_pago: '',
  items: [
    { producto_id: null, cantidad: 1, precio_unitario: 0, observaciones: '' }
  ]
})

const menuOptions = computed(() =>
  store.menuItems.filter(m => m.disponible).map(m => ({
    id: m.id,
    name: `${m.nombre} (Bs ${Number(m.precio).toFixed(2)})`,
    price: Number(m.precio)
  }))
)

const meserosOptions = computed(() =>
  usersStore.users.filter(u => u.rol === 'mesero' || u.rol === 'admin').map(u => ({
    id: u.id,
    name: `${u.nombre} ${u.apellido || ''}`.trim()
  }))
)

const paymentMethods = ['efectivo', 'tarjeta', 'qr', 'transferencia']

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
  fecha: {
    rules: [required('La fecha es obligatoria')],
    value: computed(() => reservationForm.value.fecha)
  },
  hora_inicio: {
    rules: [required('La hora es obligatoria')],
    value: computed(() => reservationForm.value.hora_inicio)
  }
})

const formatDateTime = (dt) => {
  if (!dt) return ''
  const datePart = typeof dt === 'string' ? dt.split('T')[0] : dt
  const d = new Date(datePart + 'T12:00:00')
  const dateStr = d.toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: 'numeric' })
  const timePart = typeof dt === 'string' && dt.includes('T') ? dt.split('T')[1] : ''
  return timePart ? `${dateStr} ${timePart}` : dateStr
}

const durationOptions = [30, 60, 90, 120, 150, 180, 240]

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
    fecha: new Date().toISOString().split('T')[0],
    hora_inicio: '19:00',
    duracion: 120,
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

const buildFechaHoraFin = (fecha, horaInicio, duracionMinutos) => {
  const [h, m] = horaInicio.split(':').map(Number)
  const start = new Date(`${fecha}T${horaInicio}`)
  start.setMinutes(start.getMinutes() + duracionMinutos)
  const pad = (n) => String(n).padStart(2, '0')
  return `${fecha}T${pad(start.getHours())}:${pad(start.getMinutes())}`
}

const saveReservation = async () => {
  if (!reservationForm.value.mesa_id) {
    alert('Debe seleccionar una mesa')
    return
  }
  if (!validateReservation()) return

  const fechaInicio = `${reservationForm.value.fecha}T${reservationForm.value.hora_inicio}`
  const fechaFin = buildFechaHoraFin(
    reservationForm.value.fecha,
    reservationForm.value.hora_inicio,
    reservationForm.value.duracion
  )

  try {
    await store.createReservation({
      cliente_id: reservationForm.value.cliente_id || null,
      mesa_id: reservationForm.value.mesa_id,
      cantidad_personas: reservationForm.value.cantidad_personas,
      fecha_hora_inicio: fechaInicio,
      fecha_hora_fin: fechaFin,
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

const openConvertModal = (reservation) => {
  convertingReservation.value = reservation
  convertForm.value = {
    mesero_id: authStore.user?.id || null,
    observaciones: '',
    metodo_pago: '',
    items: [{ producto_id: null, cantidad: 1, precio_unitario: 0, observaciones: '' }]
  }
  showConvertModal.value = true
}

const closeConvertModal = () => {
  showConvertModal.value = false
  convertingReservation.value = null
}

const addConvertItemRow = () => {
  convertForm.value.items.push({ producto_id: null, cantidad: 1, precio_unitario: 0, observaciones: '' })
}

const removeConvertItemRow = (idx) => {
  if (convertForm.value.items.length > 1) {
    convertForm.value.items.splice(idx, 1)
  }
}

const updateConvertItemPrice = (idx) => {
  const selected = store.menuItems.find(m => m.id === convertForm.value.items[idx].producto_id)
  if (selected) {
    convertForm.value.items[idx].precio_unitario = Number(selected.precio)
  }
}

const submitConvertToOrder = async () => {
  if (!convertForm.value.mesero_id) {
    alert('Debe seleccionar un mesero')
    return
  }

  const validItems = convertForm.value.items
    .filter((item) => item.producto_id && item.cantidad > 0)
    .map((item) => ({
      producto_id: Number(item.producto_id),
      cantidad: Number(item.cantidad),
      precio_unitario: Number(item.precio_unitario),
      observaciones: item.observaciones || null
    }))

  if (validItems.length === 0) {
    alert('Al menos un producto es obligatorio')
    return
  }

  try {
    const payload = {
      mesero_id: convertForm.value.mesero_id,
      observaciones: convertForm.value.observaciones || null,
      metodo_pago: convertForm.value.metodo_pago || null,
      items: validItems
    }

    await store.convertirReservaAPedido(convertingReservation.value.id, payload)
    closeConvertModal()
  } catch (error) {
    alert('Error al crear pedido: ' + (error.message || 'Error desconocido'))
  }
}

const todayStr = computed(() => new Date().toISOString().split('T')[0])

const todayReservations = computed(() => {
  return store.reservations.filter(r =>
    (r.fecha_hora_inicio && r.fecha_hora_inicio.startsWith(todayStr.value)) ||
    r.estado === 'pendiente'
  )
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
  await store.loadMenuItems()
  await usersStore.fetchUsers()
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
                  <span class="material-symbols-outlined">calendar_month</span>
                  {{ formatDateTime(reservation.fecha_hora_inicio) }}
                </span>
                <span class="detail-item">
                  <span class="material-symbols-outlined">schedule</span>
                  {{ reservation.fecha_hora_inicio.split('T')[1] }} -
                  {{ reservation.fecha_hora_fin.split('T')[1] }}
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
            <div v-if="reservation.estado === 'confirmada'" class="reservation-actions">
              <button @click="openConvertModal(reservation)" class="btn btn-success btn-sm">
                Crear Pedido
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
                v-model="reservationForm.fecha"
                label="Fecha"
                type="date"
                required
                :error="getReservationError('fecha')"
                @blur="touchReservationField('fecha')"
              />
              <FormField
                v-model="reservationForm.hora_inicio"
                label="Hora inicio"
                type="time"
                required
                :error="getReservationError('hora_inicio')"
                @blur="touchReservationField('hora_inicio')"
              />
              <div class="form-group">
                <label class="form-label">Duracion</label>
                <select v-model="reservationForm.duracion" class="input">
                  <option v-for="d in durationOptions" :key="d" :value="d">{{ d }} min</option>
                </select>
              </div>
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

    <!-- Convert to Order Modal -->
    <Teleport to="body">
      <div v-if="showConvertModal" class="modal-overlay">
        <div @click="closeConvertModal" class="modal-backdrop"></div>
        <div class="modal-content">
          <div class="modal-header">
            <h2 class="modal-title">Crear Pedido - {{ convertingReservation?.cliente_nombre || 'Reservacion' }}</h2>
            <button @click="closeConvertModal" class="modal-close">
              <span class="material-symbols-outlined">close</span>
            </button>
          </div>

          <form @submit.prevent="submitConvertToOrder" class="modal-form">
            <div class="form-row">
              <div class="form-group">
                <label class="form-label">Mesero</label>
                <select v-model="convertForm.mesero_id" class="input" required>
                  <option value="" disabled>Selecciona un mesero</option>
                  <option v-for="m in meserosOptions" :key="m.id" :value="m.id">
                    {{ m.name }}
                  </option>
                </select>
              </div>
              <div class="form-group">
                <label class="form-label">Metodo de pago</label>
                <select v-model="convertForm.metodo_pago" class="input">
                  <option value="">Seleccionar (opcional)</option>
                  <option v-for="method in paymentMethods" :key="method" :value="method">
                    {{ method.charAt(0).toUpperCase() + method.slice(1) }}
                  </option>
                </select>
              </div>
            </div>

            <div class="form-group">
              <label class="form-label">Productos</label>
              <div class="order-items-form">
                <div class="order-item-row order-item-header">
                  <span>Producto</span>
                  <span>Cantidad</span>
                  <span>Precio</span>
                  <span>Notas</span>
                  <span></span>
                </div>
                <div v-for="(item, index) in convertForm.items" :key="index" class="order-item-row">
                  <select v-model="item.producto_id" @change="updateConvertItemPrice(index)" class="input">
                    <option value="" disabled>Selecciona un producto</option>
                    <option v-for="menuItem in menuOptions" :key="menuItem.id" :value="menuItem.id">
                      {{ menuItem.name }}
                    </option>
                  </select>
                  <input v-model="item.cantidad" type="number" min="1" class="input item-input" placeholder="Cant." />
                  <input v-model="item.precio_unitario" type="number" min="0" step="0.01" class="input item-input" placeholder="Precio" />
                  <input v-model="item.observaciones" type="text" class="input item-input" placeholder="Notas" />
                  <button type="button" @click="removeConvertItemRow(index)" class="btn btn-secondary btn-sm">X</button>
                </div>
              </div>
              <button type="button" @click="addConvertItemRow" class="btn btn-primary btn-sm">Agregar item</button>
            </div>

            <div class="form-group">
              <label class="form-label">Mesa</label>
              <p class="form-static">Mesa {{ convertingReservation?.mesa_numero }} - {{ convertingReservation?.cantidad_personas }} personas</p>
            </div>

            <div class="form-group">
              <label class="form-label">Observaciones</label>
              <input v-model="convertForm.observaciones" type="text" class="input" placeholder="Notas para el pedido..." />
            </div>

            <div class="modal-actions">
              <button type="button" @click="closeConvertModal" class="btn btn-secondary">Cancelar</button>
              <button type="submit" class="btn btn-success">Crear Pedido</button>
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

.form-row-4 {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
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

.btn-success {
  background: linear-gradient(135deg, var(--success) 0%, #2dd4a0 100%);
  color: white;
}

.btn-success:hover {
  transform: scale(1.01);
}

.order-items-form {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.order-item-row {
  display: grid;
  grid-template-columns: 1.2fr 0.6fr 0.8fr 1.2fr auto;
  gap: 0.75rem;
  align-items: center;
}

.order-item-header {
  font-size: 0.75rem;
  font-weight: 700;
  letter-spacing: 0.03em;
  color: var(--on-surface-variant);
}

.order-item-row .input {
  width: 100%;
}

.item-input {
  width: 100%;
}

.form-static {
  font-size: 0.875rem;
  color: var(--on-surface);
  padding: 0.75rem 1rem;
  background: var(--surface-container);
  border-radius: var(--radius);
}
</style>
