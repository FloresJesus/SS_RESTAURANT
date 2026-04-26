<script setup>
import { ref, computed } from 'vue'
import { useRestaurantStore } from '@/stores/restaurant'

const store = useRestaurantStore()

const selectedStatus = ref('all')

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

const getStatusLabel = (status) => {
  const found = statuses.find(s => s.value === status)
  return found ? found.label : status
}

const formatCurrency = (value) => {
  return new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(value)
}

const updateStatus = (orderId, newStatus) => {
  store.updateOrderStatus(orderId, newStatus)
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



</script>

<template>
  <div class="orders-page">
    <!-- Header -->
    <div class="page-header">
      <div class="header-info">
        <h1 class="page-title">Gestion de Pedidos</h1>
        <p class="page-subtitle">Monitorea y actualiza los pedidos en tiempo real</p>
      </div>
      <button @click="openAddModal" class="btn btn-primary">
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
                <div class="order-table-badge">{{ order.table }}</div>
                <div>
                  <p class="order-title">Mesa {{ order.table }}</p>
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
                <span class="item-name">{{ item.qty }}x {{ item.name }}</span>
                <span class="item-price">{{ formatCurrency(item.qty * item.price) }}</span>
              </div>
            </div>
            
            <!-- Order Footer -->
            <div class="order-footer">
              <div class="order-total">
                <p class="total-label">Total</p>
                <p class="total-value">{{ formatCurrency(order.total) }}</p>
              </div>
              <button 
                v-if="getNextStatus(order.status)"
                @click="updateStatus(order.id, getNextStatus(order.status))"
                class="btn btn-primary btn-sm"
              >
                {{ getNextStatusLabel(order.status) }}
              </button>
              <span v-else class="completed-badge">
                <span class="material-symbols-outlined">check_circle</span>
                Completado
              </span>
            </div>
            
            <!-- Waiter Info -->
            <div class="order-waiter">
              <span class="material-symbols-outlined">person</span>
              {{ order.waiter }}
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
                  <div class="mini-badge">{{ order.table }}</div>
                  Mesa {{ order.table }}
                </div>
              </td>
              <td>
                <div class="cell-items">
                  <span v-for="(item, idx) in order.items.slice(0, 2)" :key="idx">
                    {{ item.qty }}x {{ item.name }}
                  </span>
                  <span v-if="order.items.length > 2" class="items-more">
                    +{{ order.items.length - 2 }} mas...
                  </span>
                </div>
              </td>
              <td class="cell-muted">{{ order.waiter }}</td>
              <td class="cell-muted">{{ order.time }}</td>
              <td class="cell-bold">{{ formatCurrency(order.total) }}</td>
              <td>
                <span :class="['badge', `badge-${order.status}`]">
                  {{ getStatusLabel(order.status) }}
                </span>
              </td>
              <td>
                <button 
                  v-if="getNextStatus(order.status)"
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
  </div>
</template>

<style scoped>
.orders-page {
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

/* Status Summary */
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

/* Kanban Grid */
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

/* Order Card */
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

/* Kanban Empty */
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

/* Table Card */
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

/* Data Table */
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
</style>
