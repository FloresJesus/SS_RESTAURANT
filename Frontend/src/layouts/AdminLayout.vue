<script setup lang="ts">
import { ref, computed, watch, onMounted, onUnmounted } from 'vue'
import { RouterLink, RouterView, useRouter, useRoute } from 'vue-router'
import { useAuthStore } from '../stores/auth'
import { useRestaurantStore } from '../stores/restaurant'
import { useNotificationStore } from '../stores/notification'

const router = useRouter()
const route = useRoute()
const authStore = useAuthStore()
const restaurantStore = useRestaurantStore()
const notifStore = useNotificationStore()
const sidebarOpen = ref(true)
const mobileMenuOpen = ref(false)

// --- Search ---
const searchQuery = ref('')
const searchOpen = ref(false)
const searchResults = ref<{ label: string; items: { name: string; path: string; subtitle: string }[] }[]>([])

watch(searchQuery, (q) => {
  const trimmed = q.trim().toLowerCase()
  if (!trimmed) {
    searchResults.value = []
    searchOpen.value = false
    return
  }

  const results: { label: string; items: { name: string; path: string; subtitle: string }[] }[] = []

  const orders = restaurantStore.orders.filter(o =>
    String(o.id).includes(trimmed) ||
    String(o.mesa_numero).includes(trimmed) ||
    (o.cliente_nombre && o.cliente_nombre.toLowerCase().includes(trimmed))
  ).slice(0, 5)
  if (orders.length) {
    results.push({
      label: 'Pedidos',
      items: orders.map(o => ({
        name: `#${o.id} - Mesa ${o.mesa_numero}`,
        path: `/orders`,
        subtitle: o.cliente_nombre || `Total: Bs ${o.total}`
      }))
    })
  }

  const menuItems = restaurantStore.menuItems.filter(m =>
    m.nombre.toLowerCase().includes(trimmed) ||
    (m.categoria_nombre && m.categoria_nombre.toLowerCase().includes(trimmed))
  ).slice(0, 5)
  if (menuItems.length) {
    results.push({
      label: 'Menu',
      items: menuItems.map(m => ({
        name: m.nombre,
        path: `/menu`,
        subtitle: `Bs ${m.precio} - ${m.categoria_nombre || 'Sin categoria'}`
      }))
    })
  }

  const customers = restaurantStore.customers.filter(c =>
    c.nombre.toLowerCase().includes(trimmed) ||
    c.telefono.includes(trimmed)
  ).slice(0, 5)
  if (customers.length) {
    results.push({
      label: 'Clientes',
      items: customers.map(c => ({
        name: c.nombre,
        path: `/customers`,
        subtitle: c.telefono
      }))
    })
  }

  const tables = restaurantStore.tables.filter(t =>
    String(t.numero).includes(trimmed)
  ).slice(0, 5)
  if (tables.length) {
    results.push({
      label: 'Mesas',
      items: tables.map(t => ({
        name: `Mesa ${t.numero}`,
        path: `/tables`,
        subtitle: `Capacidad: ${t.capacidad} - ${t.estado}`
      }))
    })
  }

  searchResults.value = results
  searchOpen.value = results.length > 0
})

const navigateTo = (path: string) => {
  searchQuery.value = ''
  searchOpen.value = false
  router.push(path)
}

// --- Notifications ---
const notifOpen = ref(false)

const timeAgo = (dateStr: string) => {
  const diff = Date.now() - new Date(dateStr).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'Ahora'
  if (mins < 60) return `hace ${mins} min`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `hace ${hours}h`
  const days = Math.floor(hours / 24)
  return `hace ${days}d`
}

const notifIcon = (tipo: string) => {
  if (tipo.includes('pending')) return 'receipt_long'
  if (tipo.includes('preparing')) return 'cooking'
  if (tipo.includes('ready')) return 'check_circle'
  if (tipo.includes('delivered')) return 'local_shipping'
  return 'notifications'
}

onMounted(() => {
  notifStore.startPolling()
  restaurantStore.loadMenuItems()
  restaurantStore.loadCustomers()
})

onUnmounted(() => {
  notifStore.stopPolling()
})

// Close dropdowns on outside click
const closeDropdowns = () => {
  notifOpen.value = false
  searchOpen.value = false
}

const allNavigation = [
  { name: 'Dashboard', path: '/', icon: 'dashboard', roles: ['admin', 'cajero', 'mesero', 'cocina'] },
  { name: 'Clientes', path: '/customers', icon: 'people', roles: ['admin', 'cajero', 'mesero'] },
  { name: 'Menu', path: '/menu', icon: 'restaurant_menu', roles: ['admin', 'cajero', 'mesero', 'cocina'] },
  { name: 'Pedidos', path: '/orders', icon: 'receipt_long', roles: ['admin', 'cajero', 'mesero', 'cocina'] },
  { name: 'Mesas', path: '/tables', icon: 'table_restaurant', roles: ['admin', 'cajero', 'mesero'] },
  { name: 'Reservaciones', path: '/reservations', icon: 'calendar_month', roles: ['admin', 'cajero', 'mesero'] },
  { name: 'Usuarios', path: '/employees', icon: 'groups', roles: ['admin'] },
  { name: 'Reportes', path: '/reports', icon: 'bar_chart', roles: ['admin'] },
  { name: 'Auditoria', path: '/audit', icon: 'history', roles: ['admin'] }
]

const navigation = computed(() => {
  const userRole = (authStore as any).user?.rol
  if (!userRole) return []
  return allNavigation.filter((item: any) => item.roles.includes(userRole))
})

const isActive = (path: string) => {
  if (path === '/') return route.path === '/'
  return route.path.startsWith(path)
}

const initials = computed(() => {
  const u = (authStore as any).user
  if (!u || !u.nombre || !u.apellido) return '?'
  return (u.nombre[0] + u.apellido[0]).toUpperCase()
})

const displayName = computed(() => {
  const u = (authStore as any).user
  if (!u || !u.nombre || !u.apellido) return 'Usuario'
  return `${u.nombre} ${u.apellido}`
})

const roleLabels: Record<string, string> = { admin: 'Administrador', cajero: 'Cajero', mesero: 'Mesero', cocina: 'Cocina' }

const displayRole = computed(() => {
  const rol = (authStore as any).user?.rol
  return rol ? roleLabels[rol] : 'Sin rol'
})

const handleLogout = () => {
  authStore.logout()
  router.push('/login').then(() => {
    window.location.reload()
  })
}
</script>

<template>
  <div class="admin-layout" @click="closeDropdowns">
    <!-- Mobile Menu Overlay -->
    <div 
      v-if="mobileMenuOpen" 
      @click="mobileMenuOpen = false"
      class="mobile-overlay"
    ></div>
    
    <!-- Sidebar -->
    <aside :class="['sidebar', { 'sidebar-collapsed': !sidebarOpen, 'sidebar-mobile-open': mobileMenuOpen }]">
      <!-- Logo -->
      <div class="sidebar-header">
        <div class="logo-icon">
          <span class="material-symbols-outlined">restaurant</span>
        </div>
        <span v-if="sidebarOpen" class="logo-text">SAN SALVADOR</span>
      </div>
      
      <!-- Navigation -->
      <nav class="sidebar-nav">
        <RouterLink
          v-for="item in navigation"
          :key="item.path"
          :to="item.path"
          :class="['nav-item', { 'nav-item-active': isActive(item.path) }]"
          @click="mobileMenuOpen = false"
        >
          <span class="material-symbols-outlined nav-icon">{{ item.icon }}</span>
          <span v-if="sidebarOpen" class="nav-text">{{ item.name }}</span>
        </RouterLink>
      </nav>
      
      <!-- User Section -->
      <div class="sidebar-footer">
        <div class="user-section">
          <div class="user-avatar">
            {{ initials }}
          </div>
          <div v-if="sidebarOpen" class="user-info">
            <p class="user-name">
              {{ displayName }}
            </p>
            <p class="user-role">{{ displayRole }}</p>
          </div>
          <button 
            v-if="sidebarOpen"
            @click="handleLogout"
            class="logout-btn"
            title="Cerrar sesion"
          >
            <span class="material-symbols-outlined">logout</span>
          </button>
        </div>
      </div>
    </aside>
    
    <!-- Main Content -->
    <div class="main-wrapper">
      <!-- Top Bar -->
      <header class="topbar">
        <div class="topbar-left">
          <!-- Mobile Menu Button -->
          <button @click="mobileMenuOpen = true" class="mobile-menu-btn">
            <span class="material-symbols-outlined">menu</span>
          </button>
          
          <!-- Toggle Sidebar (Desktop) -->
          <button @click="sidebarOpen = !sidebarOpen" class="sidebar-toggle">
            <span class="material-symbols-outlined">{{ sidebarOpen ? 'menu_open' : 'menu' }}</span>
          </button>
          
          <!-- Search -->
          <div class="search-wrapper" @click.stop>
            <span class="material-symbols-outlined search-icon">search</span>
            <input
              v-model="searchQuery"
              type="text"
              placeholder="Buscar pedidos, menu, clientes..."
              class="search-input"
              @focus="searchQuery ? searchOpen = true : null"
            />
            <div v-if="searchOpen" class="search-dropdown">
              <div v-for="group in searchResults" :key="group.label" class="search-group">
                <p class="search-group-title">{{ group.label }}</p>
                <button
                  v-for="item in group.items"
                  :key="item.name"
                  class="search-result-item"
                  @click="navigateTo(item.path)"
                >
                  <div class="search-result-info">
                    <p class="search-result-name">{{ item.name }}</p>
                    <p class="search-result-subtitle">{{ item.subtitle }}</p>
                  </div>
                </button>
              </div>
            </div>
          </div>
        </div>
        
        <div class="topbar-right">
          <!-- Notifications -->
          <div class="notif-wrapper" @click.stop>
            <button @click="notifOpen = !notifOpen" class="topbar-btn notification-btn">
              <span class="material-symbols-outlined">notifications</span>
              <span v-if="notifStore.unreadCount > 0" class="notification-badge">{{ notifStore.unreadCount }}</span>
            </button>
            <div v-if="notifOpen" class="notif-dropdown">
              <div class="notif-header">
                <h3 class="notif-title">Notificaciones</h3>
                <button v-if="notifStore.unreadCount > 0" @click="notifStore.markAllAsRead()" class="notif-mark-read">
                  Marcar todas leidas
                </button>
              </div>
              <div class="notif-list">
                <div v-for="n in notifStore.notifications" :key="n.id" :class="['notif-item', { 'notif-unread': !n.leida }]" @click="notifStore.markAsRead(n.id)">
                  <span class="material-symbols-outlined notif-item-icon">{{ notifIcon(n.tipo) }}</span>
                  <div class="notif-item-content">
                    <p class="notif-item-title">{{ n.titulo }}</p>
                    <p class="notif-item-message">{{ n.mensaje }}</p>
                    <p class="notif-item-time">{{ timeAgo(n.creado_en) }}</p>
                  </div>
                </div>
                <p v-if="notifStore.notifications.length === 0" class="notif-empty">No hay notificaciones</p>
              </div>
            </div>
          </div>
          
          <!-- Settings -->
          <RouterLink to="/settings" class="topbar-btn">
            <span class="material-symbols-outlined">settings</span>
          </RouterLink>
        </div>
      </header>
      
      <!-- Page Content -->
      <main class="main-content">
        <RouterView />
      </main>
    </div>
  </div>
</template>

<style scoped>
.admin-layout {
  min-height: 100vh;
  display: flex;
  background: var(--surface);
}

/* Mobile Overlay */
.mobile-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.5);
  z-index: 40;
  display: none;
}

@media (max-width: 1023px) {
  .mobile-overlay {
    display: block;
  }
}

/* Sidebar */
.sidebar {
  position: fixed;
  top: 0;
  left: 0;
  bottom: 0;
  width: 16rem;
  background: var(--surface-container-lowest);
  border-right: 1px solid var(--outline-variant);
  display: flex;
  flex-direction: column;
  z-index: 50;
  transition: all var(--transition-slow);
  transform: translateX(-100%);
  height: 100vh;
}

@media (min-width: 1024px) {
  .sidebar {
    position: sticky;
    transform: translateX(0);
  }
}

.sidebar-mobile-open {
  transform: translateX(0);
}

.sidebar-collapsed {
  width: 5rem;
}

/* Sidebar Header */
.sidebar-header {
  height: 4rem;
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0 1rem;
  border-bottom: 1px solid var(--outline-variant);
}

.logo-icon {
  width: 2.5rem;
  height: 2.5rem;
  background: linear-gradient(135deg, var(--primary) 0%, var(--primary-container) 100%);
  border-radius: var(--radius-xl);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.logo-icon .material-symbols-outlined {
  color: white;
  font-size: 1.5rem;
}

.logo-text {
  font-family: var(--font-headline);
  font-style: italic;
  font-size: 1rem;
  font-weight: 600;
  color: var(--on-surface);
  letter-spacing: -0.02em;
}

/* Sidebar Navigation */
.sidebar-nav {
  flex: 1;
  padding: 1rem;
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
  overflow-y: auto;
}

.nav-item {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.75rem;
  border-radius: var(--radius-lg);
  color: var(--on-surface-variant);
  text-decoration: none;
  transition: all var(--transition-base);
}

.nav-item:hover {
  background: var(--surface-container);
  color: var(--on-surface);
}

.nav-item-active {
  background: linear-gradient(135deg, var(--primary) 0%, var(--primary-container) 100%);
  color: white;
}

.nav-item-active:hover {
  background: linear-gradient(135deg, var(--primary) 0%, var(--primary-container) 100%);
  color: white;
}

.nav-icon {
  font-size: 1.25rem;
  flex-shrink: 0;
}

.nav-text {
  font-size: 0.875rem;
  font-weight: 500;
}

.sidebar-collapsed .nav-text {
  display: none;
}

/* Sidebar Footer */
.sidebar-footer {
  padding: 1rem;
  border-top: 1px solid var(--outline-variant);
}

.user-section {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.user-avatar {
  width: 2.5rem;
  height: 2.5rem;
  border-radius: var(--radius-full);
  background: rgba(0, 52, 43, 0.1);
  color: var(--primary);
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 600;
  font-size: 0.875rem;
  flex-shrink: 0;
}

.user-info {
  flex: 1;
  min-width: 0;
}

.user-name {
  font-size: 0.875rem;
  font-weight: 600;
  color: var(--on-surface);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.user-role {
  font-size: 0.75rem;
  color: var(--on-surface-variant);
  text-transform: capitalize;
}

.logout-btn {
  padding: 0.5rem;
  background: transparent;
  border: none;
  color: var(--on-surface-variant);
  cursor: pointer;
  border-radius: var(--radius);
  transition: all var(--transition-base);
}

.logout-btn:hover {
  color: var(--error);
  background: rgba(186, 26, 26, 0.1);
}

.logout-btn .material-symbols-outlined {
  font-size: 1.25rem;
}

/* Main Wrapper */
.main-wrapper {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-width: 0;
}

@media (min-width: 1024px) {
  .main-wrapper {
    margin-left: 0;
  }
}

/* Top Bar */
.topbar {
  height: 4rem;
  background: var(--surface-container-lowest);
  border-bottom: 1px solid var(--outline-variant);
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 1rem;
  position: sticky;
  top: 0;
  z-index: 30;
}

@media (min-width: 1024px) {
  .topbar {
    padding: 0 1.5rem;
  }
}

.topbar-left {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.topbar-right {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.mobile-menu-btn {
  padding: 0.5rem;
  background: transparent;
  border: none;
  color: var(--on-surface-variant);
  cursor: pointer;
  border-radius: var(--radius);
  transition: color var(--transition-base);
  display: flex;
  align-items: center;
  justify-content: center;
}

@media (min-width: 1024px) {
  .mobile-menu-btn {
    display: none;
  }
}

.mobile-menu-btn:hover {
  color: var(--on-surface);
}

.sidebar-toggle {
  padding: 0.5rem;
  background: transparent;
  border: none;
  color: var(--on-surface-variant);
  cursor: pointer;
  border-radius: var(--radius);
  transition: color var(--transition-base);
  display: none;
  align-items: center;
  justify-content: center;
}

@media (min-width: 1024px) {
  .sidebar-toggle {
    display: flex;
  }
}

.sidebar-toggle:hover {
  color: var(--on-surface);
}

/* Search */
.search-wrapper {
  position: relative;
  display: none;
}

@media (min-width: 640px) {
  .search-wrapper {
    display: flex;
    align-items: center;
  }
}

.search-input {
  width: 16rem;
  padding: 0.5rem 1rem 0.5rem 2.5rem;
  background: var(--surface-container);
  border: 1px solid var(--outline-variant);
  border-radius: var(--radius-lg);
  font-family: var(--font-body);
  font-size: 0.875rem;
  color: var(--on-surface);
  transition: all var(--transition-base);
}

.search-input::placeholder {
  color: var(--on-surface-variant);
}

.search-input:focus {
  outline: none;
  border-color: var(--primary);
  box-shadow: 0 0 0 2px rgba(0, 52, 43, 0.1);
}

.search-icon {
  position: absolute;
  left: 0.75rem;
  color: var(--on-surface-variant);
  font-size: 1.125rem;
}

/* Top Bar Buttons */
.topbar-btn {
  position: relative;
  padding: 0.5rem;
  background: transparent;
  border: none;
  color: var(--on-surface-variant);
  cursor: pointer;
  border-radius: var(--radius);
  transition: color var(--transition-base);
  display: flex;
  align-items: center;
  justify-content: center;
}

.topbar-btn {
  text-decoration: none;
}

.topbar-btn:hover {
  color: var(--on-surface);
}

.notification-dot {
  position: absolute;
  top: 0.25rem;
  right: 0.25rem;
  width: 0.5rem;
  height: 0.5rem;
  background: var(--primary);
  border-radius: var(--radius-full);
}

/* Main Content */
.main-content {
  flex: 1;
  padding: 1rem;
  overflow-y: auto;
}

@media (min-width: 1024px) {
  .main-content {
    padding: 1.5rem;
  }
}

/* Search Dropdown */
.search-dropdown {
  position: absolute;
  top: calc(100% + 0.5rem);
  left: 0;
  right: 0;
  background: var(--surface-container-lowest);
  border: 1px solid var(--outline-variant);
  border-radius: var(--radius-xl);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12);
  max-height: 24rem;
  overflow-y: auto;
  z-index: 100;
}

.search-group {
  padding: 0.5rem;
}

.search-group + .search-group {
  border-top: 1px solid var(--outline-variant);
}

.search-group-title {
  font-size: 0.625rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: var(--on-surface-variant);
  padding: 0.25rem 0.75rem;
  margin-bottom: 0.25rem;
}

.search-result-item {
  width: 100%;
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.5rem 0.75rem;
  background: transparent;
  border: none;
  border-radius: var(--radius-lg);
  cursor: pointer;
  transition: background var(--transition-base);
  text-align: left;
}

.search-result-item:hover {
  background: var(--surface-container);
}

.search-result-name {
  font-size: 0.8125rem;
  font-weight: 500;
  color: var(--on-surface);
}

.search-result-subtitle {
  font-size: 0.75rem;
  color: var(--on-surface-variant);
}

/* Notifications */
.notif-wrapper {
  position: relative;
}

.notif-dropdown {
  position: absolute;
  top: calc(100% + 0.5rem);
  right: 0;
  width: 22rem;
  background: var(--surface-container-lowest);
  border: 1px solid var(--outline-variant);
  border-radius: var(--radius-xl);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12);
  z-index: 100;
  max-height: 28rem;
  display: flex;
  flex-direction: column;
}

.notif-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1rem 1rem 0.75rem;
  border-bottom: 1px solid var(--outline-variant);
}

.notif-title {
  font-size: 0.9375rem;
  font-weight: 600;
  color: var(--on-surface);
}

.notif-mark-read {
  font-size: 0.75rem;
  color: var(--primary);
  background: none;
  border: none;
  cursor: pointer;
  padding: 0.25rem 0.5rem;
  border-radius: var(--radius);
  transition: background var(--transition-base);
}

.notif-mark-read:hover {
  background: rgba(0, 52, 43, 0.08);
}

.notif-list {
  overflow-y: auto;
  flex: 1;
}

.notif-item {
  display: flex;
  gap: 0.75rem;
  padding: 0.75rem 1rem;
  cursor: pointer;
  transition: background var(--transition-base);
  border-left: 3px solid transparent;
}

.notif-item:hover {
  background: var(--surface-container);
}

.notif-unread {
  background: rgba(0, 52, 43, 0.04);
  border-left-color: var(--primary);
}

.notif-item-icon {
  font-size: 1.25rem;
  color: var(--primary);
  margin-top: 0.125rem;
  flex-shrink: 0;
}

.notif-item-content {
  flex: 1;
  min-width: 0;
}

.notif-item-title {
  font-size: 0.8125rem;
  font-weight: 500;
  color: var(--on-surface);
  margin-bottom: 0.125rem;
}

.notif-item-message {
  font-size: 0.75rem;
  color: var(--on-surface-variant);
  margin-bottom: 0.25rem;
}

.notif-item-time {
  font-size: 0.6875rem;
  color: var(--outline);
}

.notif-empty {
  text-align: center;
  padding: 2rem;
  color: var(--on-surface-variant);
  font-size: 0.875rem;
}

.notification-badge {
  position: absolute;
  top: 0.125rem;
  right: 0.125rem;
  min-width: 1.125rem;
  height: 1.125rem;
  background: var(--primary);
  color: white;
  font-size: 0.625rem;
  font-weight: 700;
  border-radius: var(--radius-full);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0 0.25rem;
}
</style>
