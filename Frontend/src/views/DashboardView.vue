<script setup>
import { computed } from 'vue'
import { useRestaurantStore } from '@/stores/restaurant'
import { Line, Doughnut } from 'vue-chartjs'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js'

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler
)

const store = useRestaurantStore()

const stats = computed(() => {
  const totalSales = store.salesData.weekly.reduce((sum, day) => sum + day.sales, 0)
  const ordersToday = store.orders.length
  const pendingOrders = store.orders.filter(order => order.status === 'pending').length
  const preparingOrders = store.orders.filter(order => order.status === 'preparing').length
  const readyOrders = store.orders.filter(order => order.status === 'ready').length
  const avgTicket = ordersToday ? store.orders.reduce((sum, order) => sum + order.total, 0) / ordersToday : 0
  const occupiedTables = store.tables.filter(table => table.status !== 'available').length
  const availableTables = store.tables.filter(table => table.status === 'available').length

  return {
    todaySales: totalSales,
    ordersToday,
    pendingOrders,
    preparingOrders,
    readyOrders,
    avgTicket,
    occupancy: store.tables.length ? Math.round((occupiedTables / store.tables.length) * 100) : 0,
    availableTables
  }
})

const formatCurrency = (value) => {
  return new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'BOB' }).format(value)
}

const lineChartData = computed(() => ({
  labels: store.salesData.weekly.map(d => d.day),
  datasets: [{
    label: 'Ventas',
    data: store.salesData.weekly.map(d => d.sales),
    borderColor: '#00342b',
    backgroundColor: 'rgba(0, 52, 43, 0.1)',
    fill: true,
    tension: 0.4,
    pointBackgroundColor: '#00342b',
    pointBorderColor: '#00342b',
    pointHoverBackgroundColor: '#fff',
    pointHoverBorderColor: '#00342b',
  }]
}))

const lineChartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: { display: false },
    tooltip: {
      backgroundColor: '#191c1c',
      titleColor: '#f8faf9',
      bodyColor: '#bfc9c4',
      borderColor: '#3f4945',
      borderWidth: 1,
      padding: 12,
      callbacks: {
        label: (context) => formatCurrency(context.raw)
      }
    }
  },
  scales: {
    x: {
      grid: { color: '#e1e3e2' },
      ticks: { color: '#707975' }
    },
    y: {
      grid: { color: '#e1e3e2' },
      ticks: { 
        color: '#707975',
        callback: (value) => 'Bs ' + value + 'k'
      }
    }
  }
}

const doughnutChartData = computed(() => ({
  labels: store.salesData.categories.map(c => c.name),
  datasets: [{
    data: store.salesData.categories.map(c => c.value),
    backgroundColor: ['#00342b', '#22c55e', '#3b82f6', '#f59e0b'],
    borderColor: '#f8faf9',
    borderWidth: 3,
  }]
}))

const doughnutChartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  cutout: '70%',
  plugins: {
    legend: {
      position: 'bottom',
      labels: {
        color: '#707975',
        padding: 16,
        usePointStyle: true,
        pointStyle: 'circle'
      }
    }
  }
}

const recentOrders = computed(() => store.orders.slice(0, 5))

const statusLabels = {
  pending: 'Pendiente',
  preparing: 'Preparando',
  ready: 'Listo',
  delivered: 'Entregado'
}
</script>

<template>
  <div class="dashboard">
    <!-- Header -->
    <div class="page-header">
      <h1 class="page-title">Dashboard</h1>
      <p class="page-subtitle">Resumen de operaciones del dia</p>
    </div>
    
    <!-- Stats Grid -->
    <div class="stats-grid">
      <!-- Sales Today -->
      <div class="stat-card">
        <div class="stat-content">
          <div class="stat-info">
            <p class="stat-label">Ventas de Hoy</p>
            <p class="stat-value">{{ formatCurrency(stats.todaySales) }}</p>
            <p class="stat-trend stat-trend-up">
              <span class="material-symbols-outlined">trending_up</span>
              +12.5% vs ayer
            </p>
          </div>
          <div class="stat-icon stat-icon-primary">
            <span class="material-symbols-outlined">payments</span>
          </div>
        </div>
      </div>
      
      <!-- Orders Today -->
      <div class="stat-card">
        <div class="stat-content">
          <div class="stat-info">
            <p class="stat-label">Pedidos Hoy</p>
            <p class="stat-value">{{ stats.ordersToday }}</p>
            <p class="stat-note">{{ stats.pendingOrders }} pendientes</p>
          </div>
          <div class="stat-icon stat-icon-success">
            <span class="material-symbols-outlined">receipt_long</span>
          </div>
        </div>
      </div>
      
      <!-- Avg Ticket -->
      <div class="stat-card">
        <div class="stat-content">
          <div class="stat-info">
            <p class="stat-label">Ticket Promedio</p>
            <p class="stat-value">{{ formatCurrency(stats.avgTicket) }}</p>
            <p class="stat-trend stat-trend-up">
              <span class="material-symbols-outlined">trending_up</span>
              +5.2% vs semana
            </p>
          </div>
          <div class="stat-icon stat-icon-blue">
            <span class="material-symbols-outlined">confirmation_number</span>
          </div>
        </div>
      </div>
      
      <!-- Occupancy -->
      <div class="stat-card">
        <div class="stat-content">
          <div class="stat-info">
            <p class="stat-label">Ocupacion</p>
            <p class="stat-value">{{ stats.occupancy }}%</p>
            <p class="stat-note">{{ stats.availableTables }} mesas libres</p>
          </div>
          <div class="stat-icon stat-icon-warning">
            <span class="material-symbols-outlined">table_restaurant</span>
          </div>
        </div>
      </div>
    </div>
    
    <!-- Charts Row -->
    <div class="charts-grid">
      <!-- Sales Chart -->
      <div class="card chart-card chart-card-wide">
        <div class="card-header">
          <div>
            <h3 class="card-title">Ventas de la Semana</h3>
            <p class="card-subtitle">Ingresos diarios</p>
          </div>
          <select class="filter-select">
            <option>Esta semana</option>
            <option>Semana pasada</option>
            <option>Este mes</option>
          </select>
        </div>
        <div class="chart-container">
          <Line :data="lineChartData" :options="lineChartOptions" />
        </div>
      </div>
      
      <!-- Categories Chart -->
      <div class="card chart-card">
        <div class="card-header">
          <div>
            <h3 class="card-title">Ventas por Categoria</h3>
            <p class="card-subtitle">Distribucion del dia</p>
          </div>
        </div>
        <div class="chart-container">
          <Doughnut :data="doughnutChartData" :options="doughnutChartOptions" />
        </div>
      </div>
    </div>
    
    <!-- Bottom Row -->
    <div class="bottom-grid">
      <!-- Recent Orders -->
      <div class="card">
        <div class="card-header">
          <h3 class="card-title">Pedidos Recientes</h3>
          <RouterLink to="/orders" class="card-link">Ver todos</RouterLink>
        </div>
        <div class="orders-list">
          <div v-for="order in recentOrders" :key="order.id" class="order-item">
            <div class="order-left">
              <div class="order-table-badge">{{ order.table }}</div>
              <div class="order-info">
                <p class="order-title">Mesa {{ order.table }}</p>
                <p class="order-meta">{{ order.items.length }} items - {{ order.time }}</p>
              </div>
            </div>
            <div class="order-right">
              <span :class="['badge', `badge-${order.status}`]">
                {{ statusLabels[order.status] }}
              </span>
              <p class="order-total">{{ formatCurrency(order.total) }}</p>
            </div>
          </div>
        </div>
      </div>
      
      <!-- Status & Quick Actions -->
      <div class="side-column">
        <!-- Order Status -->
        <div class="card">
          <h3 class="card-title">Estado de Pedidos</h3>
          <div class="status-grid">
            <div class="status-item status-warning">
              <p class="status-value">{{ stats.pendingOrders }}</p>
              <p class="status-label">Pendientes</p>
            </div>
            <div class="status-item status-primary">
              <p class="status-value">{{ stats.preparingOrders }}</p>
              <p class="status-label">Preparando</p>
            </div>
            <div class="status-item status-success">
              <p class="status-value">{{ stats.readyOrders }}</p>
              <p class="status-label">Listos</p>
            </div>
          </div>
        </div>
        
        <!-- Quick Actions -->
        <div class="card">
          <h3 class="card-title">Acciones Rapidas</h3>
          <div class="actions-grid">
            <RouterLink to="/orders" class="action-btn">
              <span class="material-symbols-outlined">add</span>
              Nuevo Pedido
            </RouterLink>
            <RouterLink to="/tables" class="action-btn">
              <span class="material-symbols-outlined">event</span>
              Reservacion
            </RouterLink>
            <RouterLink to="/menu" class="action-btn">
              <span class="material-symbols-outlined">edit</span>
              Editar Menu
            </RouterLink>
            <RouterLink to="/employees" class="action-btn">
              <span class="material-symbols-outlined">person_add</span>
              Empleados
            </RouterLink>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.dashboard {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

/* Page Header */
.page-header {
  margin-bottom: 0.5rem;
}

.page-title {
  font-family: var(--font-headline);
  font-size: 1.5rem;
  font-weight: 600;
  color: var(--on-surface);
  margin-bottom: 0.25rem;
}

.page-subtitle {
  font-size: 0.875rem;
  color: var(--on-surface-variant);
}

/* Stats Grid */
.stats-grid {
  display: grid;
  grid-template-columns: repeat(1, 1fr);
  gap: 1rem;
}

@media (min-width: 640px) {
  .stats-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (min-width: 1024px) {
  .stats-grid {
    grid-template-columns: repeat(4, 1fr);
  }
}

.stat-card {
  background: var(--surface-container-lowest);
  border: 1px solid var(--outline-variant);
  border-radius: var(--radius-xl);
  padding: 1.5rem;
}

.stat-content {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
}

.stat-info {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
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

.stat-trend {
  display: flex;
  align-items: center;
  gap: 0.25rem;
  font-size: 0.75rem;
  margin-top: 0.25rem;
}

.stat-trend .material-symbols-outlined {
  font-size: 0.875rem;
}

.stat-trend-up {
  color: var(--success);
}

.stat-note {
  font-size: 0.75rem;
  color: var(--on-surface-variant);
  margin-top: 0.25rem;
}

.stat-icon {
  width: 3rem;
  height: 3rem;
  border-radius: var(--radius-xl);
  display: flex;
  align-items: center;
  justify-content: center;
}

.stat-icon .material-symbols-outlined {
  font-size: 1.5rem;
}

.stat-icon-primary {
  background: rgba(0, 52, 43, 0.1);
  color: var(--primary);
}

.stat-icon-success {
  background: rgba(34, 197, 94, 0.1);
  color: var(--success);
}

.stat-icon-blue {
  background: rgba(59, 130, 246, 0.1);
  color: #3b82f6;
}

.stat-icon-warning {
  background: rgba(245, 158, 11, 0.1);
  color: var(--warning);
}

/* Charts */
.charts-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: 1.5rem;
}

@media (min-width: 1024px) {
  .charts-grid {
    grid-template-columns: 2fr 1fr;
  }
}

.chart-card {
  min-height: 20rem;
}

.chart-container {
  height: 16rem;
}

/* Card Styles */
.card {
  background: var(--surface-container-lowest);
  border: 1px solid var(--outline-variant);
  border-radius: var(--radius-xl);
  padding: 1.5rem;
}

.card-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  margin-bottom: 1.5rem;
}

.card-title {
  font-size: 1rem;
  font-weight: 600;
  color: var(--on-surface);
  margin-bottom: 0.25rem;
}

.card-subtitle {
  font-size: 0.875rem;
  color: var(--on-surface-variant);
}

.card-link {
  font-size: 0.875rem;
  color: var(--primary);
  text-decoration: none;
  transition: color var(--transition-base);
}

.card-link:hover {
  color: var(--primary-container);
}

.filter-select {
  padding: 0.375rem 0.75rem;
  background: var(--surface-container);
  border: 1px solid var(--outline-variant);
  border-radius: var(--radius-lg);
  font-size: 0.875rem;
  color: var(--on-surface-variant);
  cursor: pointer;
}

.filter-select:focus {
  outline: none;
  border-color: var(--primary);
}

/* Bottom Grid */
.bottom-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: 1.5rem;
}

@media (min-width: 1024px) {
  .bottom-grid {
    grid-template-columns: 1fr 1fr;
  }
}

/* Orders List */
.orders-list {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.order-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.75rem;
  background: var(--surface-container);
  border-radius: var(--radius-lg);
}

.order-left {
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
  font-weight: 600;
  font-size: 0.875rem;
  color: var(--primary);
}

.order-info {
  display: flex;
  flex-direction: column;
}

.order-title {
  font-size: 0.875rem;
  font-weight: 500;
  color: var(--on-surface);
}

.order-meta {
  font-size: 0.75rem;
  color: var(--on-surface-variant);
}

.order-right {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 0.25rem;
}

.order-total {
  font-size: 0.875rem;
  font-weight: 500;
  color: var(--on-surface);
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

/* Side Column */
.side-column {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

/* Status Grid */
.status-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 1rem;
  margin-top: 1rem;
}

.status-item {
  text-align: center;
  padding: 1rem;
  border-radius: var(--radius-xl);
}

.status-value {
  font-size: 1.875rem;
  font-weight: 700;
}

.status-label {
  font-size: 0.75rem;
  color: var(--on-surface-variant);
  margin-top: 0.25rem;
}

.status-warning {
  background: rgba(245, 158, 11, 0.1);
}

.status-warning .status-value {
  color: var(--warning);
}

.status-primary {
  background: rgba(0, 52, 43, 0.1);
}

.status-primary .status-value {
  color: var(--primary);
}

.status-success {
  background: rgba(34, 197, 94, 0.1);
}

.status-success .status-value {
  color: var(--success);
}

/* Actions Grid */
.actions-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 0.75rem;
  margin-top: 1rem;
}

.action-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  padding: 0.75rem;
  background: var(--surface-container);
  border: 1px solid var(--outline-variant);
  border-radius: var(--radius-lg);
  font-size: 0.75rem;
  font-weight: 500;
  color: var(--on-surface);
  text-decoration: none;
  transition: all var(--transition-base);
}

.action-btn:hover {
  background: var(--surface-container-high);
  border-color: var(--primary);
  color: var(--primary);
}

.action-btn .material-symbols-outlined {
  font-size: 1rem;
}
</style>
