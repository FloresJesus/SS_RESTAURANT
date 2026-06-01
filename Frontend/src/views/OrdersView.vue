<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRestaurantStore } from '@/stores/restaurant'
import { useAuthStore } from '@/stores/auth'
import { apiFetch } from '@/utils/api'
import { required, noNumbers, onlyLetters, isPhone, isEmail, min } from '@/utils/validators'
import { useFormValidation } from '@/composables/useFormValidation'
import FormField from '@/components/FormField.vue'

const store = useRestaurantStore()
const authStore = useAuthStore()

const userRole = computed(() => authStore.user?.rol || '')

const selectedStatus = ref('all')
const showOrderModal = ref(false)
const showNewCustomerForm = ref(false)
const paymentMethods = ['efectivo', 'tarjeta', 'qr', 'transferencia']

const orderForm = ref({
  mesa_id: null,
  cliente_id: null,
  reserva_id: null,
  mesero_id: authStore.user?.id || null,
  observaciones: '',
  metodo_pago: '',
  items: [
    { producto_id: null, cantidad: 1, precio_unitario: 0, observaciones: '' }
  ]
})

const newCustomerForm = ref({
  nombre: '',
  telefono: '',
  email: ''
})

const { validateField, touchField, validateAll, getError, resetValidation } = useFormValidation({
  newName: {
    rules: [required('El nombre es obligatorio'), noNumbers(), onlyLetters()],
    value: computed(() => newCustomerForm.value.nombre)
  },
  newPhone: {
    rules: [required('El telefono es obligatorio'), isPhone()],
    value: computed(() => newCustomerForm.value.telefono)
  },
  newEmail: {
    rules: [isEmail()],
    value: computed(() => newCustomerForm.value.email)
  }
})

const statuses = [
  { value: 'all', label: 'Todos' },
  { value: 'pending', label: 'Pendientes' },
  { value: 'preparing', label: 'Preparando' },
  { value: 'ready', label: 'Listos' },
  { value: 'delivered', label: 'Entregados' }
]

const filteredOrders = computed(() => {
  if (selectedStatus.value === 'all') return store.orders
  return store.orders.filter(order => order.status === selectedStatus.value)
})

const orderSubtotal = computed(() => {
  return orderForm.value.items.reduce((sum, item) => {
    if (item.producto_id && item.cantidad) {
      return sum + (Number(item.precio_unitario) * Number(item.cantidad))
    }
    return sum
  }, 0)
})

const orderTotal = computed(() => {
  return parseFloat(orderSubtotal.value.toFixed(2))
})

const getStatusLabel = (status) => {
  const found = statuses.find(s => s.value === status)
  return found ? found.label : status
}

const formatCurrency = (value) => {
  return `Bs ${Number(value).toFixed(2)}`
}

const menuOptions = computed(() =>
  store.menuItems.filter(m => m.disponible).map(m => ({
    id: m.id,
    name: `${m.nombre} (Bs ${Number(m.precio).toFixed(2)})`,
    price: Number(m.precio)
  }))
)

const addItemRow = () => {
  orderForm.value.items.push({ producto_id: null, cantidad: 1, precio_unitario: 0, observaciones: '' })
}

const removeItemRow = (idx) => {
  if (orderForm.value.items.length > 1) {
    orderForm.value.items.splice(idx, 1)
  }
}

const updateItemPrice = (idx) => {
  const selected = store.menuItems.find(m => m.id === orderForm.value.items[idx].producto_id)
  if (selected) {
    orderForm.value.items[idx].precio_unitario = Number(selected.precio)
  }
}

const canCreateOrder = computed(() => ['admin', 'mesero', 'cajero'].includes(userRole.value))

const canUpdateTo = (orderStatus) => {
  if (userRole.value === 'admin') return true
  if (userRole.value === 'cocina') {
    return orderStatus === 'pending' || orderStatus === 'preparing'
  }
  if (userRole.value === 'mesero') {
    return orderStatus === 'ready'
  }
  return false
}

const getNextStatus = (currentStatus) => {
  const flow = ['pending', 'preparing', 'ready', 'delivered']
  const currentIndex = flow.indexOf(currentStatus)
  return currentIndex < flow.length - 1 ? flow[currentIndex + 1] : null
}

const getNextStatusLabel = (currentStatus) => {
  const next = getNextStatus(currentStatus)
  if (!next) return null
  const labels = { preparing: 'Iniciar Preparacion', ready: 'Marcar Listo', delivered: 'Marcar Entregado' }
  return labels[next]
}

const ordersByStatus = computed(() => ({
  pending: store.orders.filter(o => o.status === 'pending'),
  preparing: store.orders.filter(o => o.status === 'preparing'),
  ready: store.orders.filter(o => o.status === 'ready'),
  delivered: store.orders.filter(o => o.status === 'delivered')
}))

const openAddModal = () => {
  if (!canCreateOrder.value) return
  orderForm.value = {
    mesa_id: null,
    cliente_id: null,
    reserva_id: null,
    mesero_id: authStore.user?.id || null,
    observaciones: '',
    metodo_pago: '',
    items: [{ producto_id: null, cantidad: 1, precio_unitario: 0, observaciones: '' }]
  }
  showNewCustomerForm.value = false
  resetValidation()
  showOrderModal.value = true
}

const closeOrderModal = () => {
  showOrderModal.value = false
  showNewCustomerForm.value = false
  resetValidation()
}

const onItemMenuChange = (idx) => {
  const selected = store.menuItems.find(m => m.id === orderForm.value.items[idx].producto_id)
  if (selected) {
    orderForm.value.items[idx].precio_unitario = Number(selected.precio)
  }
}

const createNewCustomer = async () => {
  if (!validateAll()) return

  try {
    const result = await store.createCustomer({
      nombre: newCustomerForm.value.nombre,
      telefono: newCustomerForm.value.telefono,
      email: newCustomerForm.value.email || null
    })
    
    if (result && result.id) {
      orderForm.value.cliente_id = result.id
      showNewCustomerForm.value = false
      newCustomerForm.value = { nombre: '', telefono: '', email: '' }
    }
  } catch (error) {
    alert('Error al crear cliente')
  }
}

const saveOrder = async () => {
  const validItems = orderForm.value.items
    .filter((item) => item.producto_id && item.cantidad > 0)
    .map((item) => ({
      producto_id: Number(item.producto_id),
      cantidad: Number(item.cantidad),
      precio_unitario: Number(item.precio_unitario),
      observaciones: item.observaciones || null
    }))

  if (!orderForm.value.mesa_id || validItems.length === 0) {
    alert('Mesa y al menos un producto son obligatorios')
    return
  }

  try {
    const payload = {
      mesa_id: Number(orderForm.value.mesa_id),
      cliente_id: orderForm.value.cliente_id || null,
      reserva_id: orderForm.value.reserva_id || null,
      mesero_id: orderForm.value.mesero_id,
      observaciones: orderForm.value.observaciones || null,
      metodo_pago: orderForm.value.metodo_pago || null,
      items: validItems
    }

    await store.createOrder(payload)
    await store.loadOrders()
    await store.loadTables()
    closeOrderModal()
  } catch (error) {
    alert('Error al crear pedido: ' + (error.message || 'Error desconocido'))
  }
}

const updateStatus = async (orderId, newStatus) => {
  try {
    await store.updateOrderStatus(orderId, newStatus)
  } catch (error) {
    console.error('Error actualizando estado:', error)
    alert(error.message || 'Error al actualizar estado')
  }
}

const canSeeWaiterInfo = computed(() => userRole.value !== 'cocina')

onMounted(async () => {
  await store.loadOrders()
  await store.loadMenuItems()
  await store.loadTables()
  await store.loadCustomers()
})
</script>

<template>
  <div class="orders-page">
    <!-- Header -->
    <div class="page-header">
      <div class="header-info">
        <h1 class="page-title">Gestion de Pedidos</h1>
        <p class="page-subtitle">Monitorea y actualiza los pedidos en tiempo real</p>
      </div>
      <button v-if="canCreateOrder" @click="openAddModal" class="btn btn-primary">
        <span class="material-symbols-outlined">add</span>
        Nuevo Pedido
      </button>
    </div>
    
    <!-- Status Summary -->
    <div class="status-summary">
      <div 
        v-for="status in statuses.slice(1)"
        :key="status.value"
        :class="['summary-card', { 'summary-card-active': selectedStatus === status.value }]"
        @click="selectedStatus = status.value"
      >
        <div class="summary-content">
          <p class="summary-label">{{ status.label }}</p>
          <p class="summary-value">{{ ordersByStatus[status.value].length }}</p>
        </div>
        <div :class="['summary-dot', `summary-dot-${status.value}`]"></div>
      </div>
    </div>
    
    <!-- Kanban View -->
    <div class="kanban-grid">
      <div 
        v-for="status in statuses.slice(1)"
        :key="status.value"
        class="kanban-column"
      >
        <!-- Column Header -->
        <div class="kanban-header">
          <div class="kanban-title">
            <span :class="['badge', `badge-${status.value}`]">{{ status.label }}</span>
            <span class="kanban-count">({{ ordersByStatus[status.value].length }})</span>
          </div>
        </div>
        
        <!-- Orders List -->
        <div class="kanban-body">
          <div
            v-for="order in ordersByStatus[status.value]"
            :key="order.id"
            class="order-card"
          >
            <!-- Order Header -->
            <div class="order-header">
              <div class="order-info">
                <div class="order-table-badge">{{ order.mesa_numero || order.mesa_id }}</div>
                <div>
                  <p class="order-title">Mesa {{ order.mesa_numero || order.mesa_id }}</p>
                  <p class="order-id">#{{ order.id }}</p>
                </div>
              </div>
              <span class="order-time">{{ order.time }}</span>
            </div>
            
            <!-- Order Items -->
            <div class="order-items">
              <div 
                v-for="(item, idx) in order.items"
                :key="idx"
                class="order-item"
              >
                <span class="item-name">{{ item.cantidad }}x {{ item.nombre }}</span>
                <span class="item-price">{{ formatCurrency(item.cantidad * item.precio_unitario) }}</span>
              </div>
            </div>
            
            <!-- Order Footer -->
            <div class="order-footer">
              <div class="order-total">
                <p class="total-label">Total</p>
                <p class="total-value">{{ formatCurrency(order.total) }}</p>
              </div>
              <button 
                v-if="getNextStatus(order.status) && canUpdateTo(order.status)"
                @click="updateStatus(order.id, getNextStatus(order.status))"
                class="btn btn-primary btn-sm"
              >
                {{ getNextStatusLabel(order.status) }}
              </button>
              <span v-else-if="!getNextStatus(order.status)" class="completed-badge">
                <span class="material-symbols-outlined">check_circle</span>
                Completado
              </span>
            </div>
            
            <!-- Payment Info -->
            <div v-if="order.metodo_pago" class="order-waiter">
              <span class="material-symbols-outlined">payments</span>
              Pago: {{ order.metodo_pago.charAt(0).toUpperCase() + order.metodo_pago.slice(1) }}
            </div>

            <!-- Waiter Info -->
            <div v-if="canSeeWaiterInfo && order.mesero_nombre" class="order-waiter">
              <span class="material-symbols-outlined">person</span>
              {{ order.mesero_nombre }}
            </div>
          </div>
          
          <!-- Empty State -->
          <div v-if="ordersByStatus[status.value].length === 0" class="kanban-empty">
            <span class="material-symbols-outlined">receipt_long</span>
            <p>Sin pedidos</p>
          </div>
        </div>
      </div>
    </div>
    
    <!-- Table View -->
    <div class="card table-card">
      <div class="table-header">
        <h3 class="table-title">Vista de Tabla</h3>
        <div class="table-filters">
          <button
            v-for="status in statuses"
            :key="status.value"
            @click="selectedStatus = status.value"
            :class="['filter-btn', { 'filter-btn-active': selectedStatus === status.value }]"
          >
            {{ status.label }}
          </button>
        </div>
      </div>
      
      <div class="table-container">
        <table class="data-table">
          <thead>
            <tr>
              <th>Pedido</th>
              <th>Mesa</th>
              <th>Items</th>
              <th>Mesero</th>
              <th>Pago</th>
              <th>Hora</th>
              <th>Total</th>
              <th>Estado</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="order in filteredOrders" :key="order.id">
              <td class="cell-bold">#{{ order.id }}</td>
              <td>
                <div class="cell-table">
                  <div class="mini-badge">{{ order.mesa_numero || order.mesa_id }}</div>
                  Mesa {{ order.mesa_numero || order.mesa_id }}
                </div>
              </td>
              <td>
                <div class="cell-items">
                  <span v-for="(item, idx) in order.items.slice(0, 2)" :key="idx">
                    {{ item.cantidad }}x {{ item.nombre }}
                  </span>
                  <span v-if="order.items.length > 2" class="items-more">
                    +{{ order.items.length - 2 }} mas...
                  </span>
                </div>
              </td>
              <td class="cell-muted">{{ order.mesero_nombre || '-' }}</td>
              <td class="cell-muted">{{ order.metodo_pago ? (order.metodo_pago.charAt(0).toUpperCase() + order.metodo_pago.slice(1)) : '-' }}</td>
              <td class="cell-muted">{{ order.time }}</td>
              <td class="cell-bold">{{ formatCurrency(order.total) }}</td>
              <td>
                <span :class="['badge', `badge-${order.status}`]">
                  {{ getStatusLabel(order.status) }}
                </span>
              </td>
              <td>
                <button
                  v-if="getNextStatus(order.status) && canUpdateTo(order.status)"
                  @click="updateStatus(order.id, getNextStatus(order.status))"
                  class="btn btn-primary btn-sm"
                >
                  {{ getNextStatusLabel(order.status) }}
                </button>
                <span v-else class="completed-text">Completado</span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <Teleport to="body">
      <div v-if="showOrderModal" class="modal-overlay">
        <div @click="closeOrderModal" class="modal-backdrop"></div>
        <div class="modal-content">
          <div class="modal-header">
            <h2 class="modal-title">Nuevo Pedido</h2>
            <button @click="closeOrderModal" class="modal-close">
              <span class="material-symbols-outlined">close</span>
            </button>
          </div>

          <form @submit.prevent="saveOrder" class="modal-form">
            <div class="form-row">
              <div class="form-group">
                <label class="form-label">Mesa</label>
                <select v-model="orderForm.mesa_id" class="input" required>
                  <option value="" disabled>Selecciona una mesa</option>
                  <option v-for="table in store.tables" :key="table.id" :value="table.id">
                    Mesa {{ table.numero }}
                  </option>
                </select>
              </div>
              <div class="form-group">
                <label class="form-label">Cliente</label>
                <div class="customer-selector">
                  <select v-if="!showNewCustomerForm" v-model="orderForm.cliente_id" class="input">
                    <option value="">Sin cliente</option>
                    <option v-for="customer in store.customers" :key="customer.id" :value="customer.id">
                      {{ customer.nombre }} ({{ customer.telefono }})
                    </option>
                  </select>
                  <div v-else class="new-customer-form">
                    <FormField
                      v-model="newCustomerForm.nombre"
                      placeholder="Nombre"
                      required
                      :error="getError('newName')"
                      @blur="touchField('newName')"
                    />
                    <FormField
                      v-model="newCustomerForm.telefono"
                      type="tel"
                      placeholder="Telefono"
                      required
                      :error="getError('newPhone')"
                      @blur="touchField('newPhone')"
                    />
                    <FormField
                      v-model="newCustomerForm.email"
                      type="email"
                      placeholder="Email (opcional)"
                      :error="getError('newEmail')"
                      @blur="touchField('newEmail')"
                    />
                    <button type="button" @click="createNewCustomer" class="btn btn-primary btn-sm">Crear</button>
                    <button type="button" @click="showNewCustomerForm = false" class="btn btn-secondary btn-sm">Cancelar</button>
                  </div>
                  <button v-if="!showNewCustomerForm" type="button" @click="showNewCustomerForm = true" class="btn btn-secondary btn-sm">+ Nuevo</button>
                </div>
              </div>
            </div>

            <div class="form-group">
              <label class="form-label">Observaciones</label>
              <input v-model="orderForm.observaciones" type="text" class="input" placeholder="Notas especiales..." />
            </div>

            <div class="form-group">
              <label class="form-label">Metodo de pago</label>
              <select v-model="orderForm.metodo_pago" class="input">
                <option value="">Seleccionar metodo (opcional)</option>
                <option v-for="method in paymentMethods" :key="method" :value="method">
                  {{ method.charAt(0).toUpperCase() + method.slice(1) }}
                </option>
              </select>
            </div>

            <div class="form-group">
              <label class="form-label">Items</label>
              <div class="order-items-form">
                <div class="order-item-row order-item-header">
                  <span>Producto</span>
                  <span>Cantidad</span>
                  <span>Precio</span>
                  <span>Notas</span>
                  <span></span>
                </div>
                <div v-for="(item, index) in orderForm.items" :key="index" class="order-item-row">
                  <select v-model="item.producto_id" @change="updateItemPrice(index)" class="input">
                    <option value="" disabled>Selecciona un producto</option>
                    <option v-for="menuItem in menuOptions" :key="menuItem.id" :value="menuItem.id">
                      {{ menuItem.name }}
                    </option>
                  </select>
                  <input v-model="item.cantidad" type="number" min="1" class="input item-input" placeholder="Cant." />
                  <input v-model="item.precio_unitario" type="number" min="0" step="0.01" class="input item-input" placeholder="Precio" />
                  <input v-model="item.observaciones" type="text" class="input item-input" placeholder="Notas" />
                  <button type="button" @click="removeItemRow(index)" class="btn btn-secondary btn-sm">X</button>
                </div>
              </div>
              <button type="button" @click="addItemRow" class="btn btn-primary btn-sm">Agregar item</button>
            </div>

            <!-- Resumen de Totales -->
            <div class="order-summary">
              <div class="summary-row">
                <span>Subtotal:</span>
                <span>{{ formatCurrency(orderSubtotal) }}</span>
              </div>
              <div class="summary-row summary-total">
                <span>TOTAL:</span>
                <span>{{ formatCurrency(orderTotal) }}</span>
              </div>
            </div>

            <div class="modal-actions">
              <button type="button" @click="closeOrderModal" class="btn btn-secondary">Cancelar</button>
              <button type="submit" class="btn btn-primary">Guardar Pedido</button>
            </div>
          </form>
        </div>
      </div>
    </Teleport>
  </div>
</template>

<style scoped>
.orders-page {
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

.status-summary {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 1rem;
}

@media (min-width: 640px) {
  .status-summary {
    grid-template-columns: repeat(4, 1fr);
  }
}

.summary-card {
  background: var(--surface-container-lowest);
  border: 1px solid var(--outline-variant);
  border-radius: var(--radius-xl);
  padding: 1rem;
  cursor: pointer;
  transition: all var(--transition-base);
}

.summary-card:hover {
  border-color: rgba(0, 52, 43, 0.5);
}

.summary-card-active {
  border-color: var(--primary);
}

.summary-content {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.summary-label {
  font-size: 0.875rem;
  color: var(--on-surface-variant);
}

.summary-value {
  font-size: 1.5rem;
  font-weight: 700;
  color: var(--on-surface);
}

.summary-dot {
  width: 0.75rem;
  height: 0.75rem;
  border-radius: var(--radius-full);
}

.summary-dot-pending { background: var(--warning); }
.summary-dot-preparing { background: var(--primary); }
.summary-dot-ready { background: var(--success); }
.summary-dot-delivered { background: var(--outline); }

.kanban-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: 1rem;
}

@media (min-width: 1024px) {
  .kanban-grid {
    grid-template-columns: repeat(4, 1fr);
  }
}

.kanban-column {
  background: var(--surface-container-lowest);
  border: 1px solid var(--outline-variant);
  border-radius: var(--radius-xl);
  overflow: hidden;
}

.kanban-header {
  padding: 1rem;
  border-bottom: 1px solid var(--outline-variant);
}

.kanban-title {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.kanban-count {
  font-size: 0.875rem;
  color: var(--on-surface-variant);
}

.kanban-body {
  padding: 0.75rem;
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  max-height: 500px;
  overflow-y: auto;
}

.order-card {
  background: var(--surface-container);
  border: 1px solid var(--outline-variant);
  border-radius: var(--radius-lg);
  padding: 1rem;
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.order-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.order-info {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.order-table-badge {
  width: 2.5rem;
  height: 2.5rem;
  background: rgba(0, 52, 43, 0.1);
  border-radius: var(--radius-lg);
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 700;
  color: var(--primary);
}

.order-title {
  font-weight: 500;
  color: var(--on-surface);
}

.order-id {
  font-size: 0.75rem;
  color: var(--on-surface-variant);
}

.order-time {
  font-size: 0.75rem;
  color: var(--on-surface-variant);
}

.order-items {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.order-item {
  display: flex;
  justify-content: space-between;
  font-size: 0.875rem;
}

.item-name {
  color: var(--on-surface-variant);
}

.item-price {
  color: var(--on-surface);
}

.order-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding-top: 0.75rem;
  border-top: 1px solid var(--outline-variant);
}

.order-total {
  display: flex;
  flex-direction: column;
}

.total-label {
  font-size: 0.75rem;
  color: var(--on-surface-variant);
}

.total-value {
  font-weight: 700;
  color: var(--on-surface);
}

.completed-badge {
  display: flex;
  align-items: center;
  gap: 0.25rem;
  font-size: 0.75rem;
  color: var(--success);
}

.completed-badge .material-symbols-outlined {
  font-size: 1rem;
}

.order-waiter {
  display: flex;
  align-items: center;
  gap: 0.25rem;
  font-size: 0.75rem;
  color: var(--on-surface-variant);
}

.order-waiter .material-symbols-outlined {
  font-size: 0.875rem;
}

.kanban-empty {
  text-align: center;
  padding: 2rem;
}

.kanban-empty .material-symbols-outlined {
  font-size: 3rem;
  color: var(--outline-variant);
  margin-bottom: 0.5rem;
}

.kanban-empty p {
  font-size: 0.875rem;
  color: var(--on-surface-variant);
}

.table-card {
  display: none;
}

@media (min-width: 1024px) {
  .table-card {
    display: block;
  }
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

.table-filters {
  display: flex;
  gap: 0.5rem;
}

.filter-btn {
  padding: 0.375rem 0.75rem;
  background: var(--surface-container-high);
  border: none;
  border-radius: var(--radius-lg);
  font-size: 0.75rem;
  font-weight: 500;
  color: var(--on-surface-variant);
  cursor: pointer;
  transition: all var(--transition-base);
}

.filter-btn:hover {
  color: var(--on-surface);
}

.filter-btn-active {
  background: linear-gradient(135deg, var(--primary) 0%, var(--primary-container) 100%);
  color: white;
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

.cell-table {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.mini-badge {
  width: 2rem;
  height: 2rem;
  background: rgba(0, 52, 43, 0.1);
  border-radius: var(--radius);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.875rem;
  font-weight: 700;
  color: var(--primary);
}

.cell-items {
  display: flex;
  flex-direction: column;
  font-size: 0.875rem;
}

.items-more {
  font-size: 0.75rem;
  color: var(--on-surface-variant);
}

.completed-text {
  font-size: 0.75rem;
  color: var(--success);
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

.badge-pending {
  background: rgba(245, 158, 11, 0.15);
  color: var(--warning);
}

.badge-preparing {
  background: rgba(0, 52, 43, 0.15);
  color: var(--primary);
}

.badge-ready {
  background: rgba(34, 197, 94, 0.15);
  color: var(--success);
}

.badge-delivered {
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

.btn-sm {
  padding: 0.5rem 0.75rem;
  font-size: 0.625rem;
}

.btn-secondary {
  background: var(--surface-container);
  color: var(--on-surface);
  border: 1px solid var(--outline-variant);
}

.card {
  background: var(--surface-container-lowest);
  border: 1px solid var(--outline-variant);
  border-radius: var(--radius-xl);
  padding: 1.5rem;
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
  max-width: 40rem;
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

.form-row {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 1rem;
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

.customer-selector {
  display: flex;
  gap: 0.5rem;
  align-items: center;
}

.customer-selector .input {
  flex: 1;
}

.new-customer-form {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.new-customer-form .input {
  width: 100%;
}

.new-customer-form button {
  padding: 0.5rem 0.75rem;
  font-size: 0.625rem;
}

.new-customer-form > :nth-last-child(-n+2) {
  align-self: flex-end;
}

.order-summary {
  background: var(--surface-container-high);
  border: 1px solid var(--outline-variant);
  border-radius: var(--radius-lg);
  padding: 1rem;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.summary-row {
  display: flex;
  justify-content: space-between;
  font-size: 0.875rem;
  color: var(--on-surface-variant);
}

.summary-total {
  border-top: 2px solid var(--outline-variant);
  padding-top: 0.75rem;
  font-weight: 700;
  color: var(--on-surface);
  font-size: 1rem;
}

.modal-actions {
  display: flex;
  gap: 0.75rem;
  margin-top: 1rem;
}

.modal-actions .btn {
  flex: 1;
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
