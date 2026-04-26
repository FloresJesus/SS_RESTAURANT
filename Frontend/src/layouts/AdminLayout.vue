<script setup>
import { ref } from 'vue'
import { RouterLink, RouterView, useRouter, useRoute } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

const router = useRouter()
const route = useRoute()
const authStore = useAuthStore()
const sidebarOpen = ref(true)
const mobileMenuOpen = ref(false)

const navigation = [
  { name: 'Dashboard', path: '/', icon: 'dashboard' },
  { name: 'Clientes', path: '/customers', icon: 'people' },
  { name: 'Menu', path: '/menu', icon: 'restaurant_menu' },
  { name: 'Pedidos', path: '/orders', icon: 'receipt_long' },
  { name: 'Mesas', path: '/tables', icon: 'table_restaurant' },
  { name: 'Empleados', path: '/employees', icon: 'groups' }
]

const isActive = (path) => {
  if (path === '/') return route.path === '/'
  return route.path.startsWith(path)
}

const handleLogout = () => {
  authStore.logout()
  router.push('/login').then(() => {
    window.location.reload()
  })
}
</script>

<template>
  <div class="admin-layout">
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
          <div class="user-avatar">{{ authStore.user?.avatar }}</div>
          <div v-if="sidebarOpen" class="user-info">
            <p class="user-name">{{ authStore.user?.name }}</p>
            <p class="user-role">{{ authStore.user?.role }}</p>
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
          <div class="search-wrapper">
            <span class="material-symbols-outlined search-icon">search</span>
            <input type="text" placeholder="Buscar..." class="search-input" />
          </div>
        </div>
        
        <div class="topbar-right">
          <!-- Notifications -->
          <button class="topbar-btn notification-btn">
            <span class="material-symbols-outlined">notifications</span>
            <span class="notification-dot"></span>
          </button>
          
          <!-- Settings -->
          <button class="topbar-btn">
            <span class="material-symbols-outlined">settings</span>
          </button>
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
</style>
