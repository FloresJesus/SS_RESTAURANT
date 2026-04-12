<script setup>
import { ref, computed } from 'vue'
import { useRestaurantStore } from '@/stores/restaurant'

const store = useRestaurantStore()

const searchQuery = ref('')
const selectedRole = ref('all')
const showModal = ref(false)
const editingEmployee = ref(null)

const roles = [
  { value: 'all', label: 'Todos' },
  { value: 'admin', label: 'Administrador' },
  { value: 'waiter', label: 'Mesero' },
  { value: 'kitchen', label: 'Cocina' }
]

const shifts = ['Manana', 'Tarde', 'Noche']

const formData = ref({
  name: '',
  email: '',
  phone: '',
  role: 'waiter',
  shift: 'Manana',
  status: 'active'
})

const filteredEmployees = computed(() => {
  return store.employees.filter(employee => {
    const matchesSearch = employee.name.toLowerCase().includes(searchQuery.value.toLowerCase()) ||
                          employee.email.toLowerCase().includes(searchQuery.value.toLowerCase())
    const matchesRole = selectedRole.value === 'all' || employee.role === selectedRole.value
    return matchesSearch && matchesRole
  })
})

const getRoleInfo = (role) => {
  const info = {
    admin: { label: 'Administrador', color: 'badge-primary' },
    waiter: { label: 'Mesero', color: 'badge-success' },
    kitchen: { label: 'Cocina', color: 'badge-warning' }
  }
  return info[role] || { label: role, color: '' }
}

const stats = computed(() => ({
  total: store.employees.length,
  active: store.employees.filter(e => e.status === 'active').length,
  admins: store.employees.filter(e => e.role === 'admin').length,
  waiters: store.employees.filter(e => e.role === 'waiter').length,
  kitchen: store.employees.filter(e => e.role === 'kitchen').length
}))

const openAddModal = () => {
  editingEmployee.value = null
  formData.value = {
    name: '',
    email: '',
    phone: '',
    role: 'waiter',
    shift: 'Manana',
    status: 'active'
  }
  showModal.value = true
}

const openEditModal = (employee) => {
  editingEmployee.value = employee
  formData.value = { ...employee }
  showModal.value = true
}

const closeModal = () => {
  showModal.value = false
  editingEmployee.value = null
}

const saveEmployee = () => {
  if (editingEmployee.value) {
    store.updateEmployee(editingEmployee.value.id, { ...formData.value })
  } else {
    store.addEmployee({ ...formData.value })
  }
  closeModal()
}

const toggleStatus = (employee) => {
  store.updateEmployee(employee.id, { 
    status: employee.status === 'active' ? 'inactive' : 'active' 
  })
}
</script>

<template>
  <div class="employees-page">
    <!-- Header -->
    <div class="page-header">
      <div class="header-info">
        <h1 class="page-title">Gestion de Empleados</h1>
        <p class="page-subtitle">Administra el equipo de trabajo</p>
      </div>
      <button @click="openAddModal" class="btn btn-primary">
        <span class="material-symbols-outlined">person_add</span>
        Agregar Empleado
      </button>
    </div>
    
    <!-- Stats -->
    <div class="stats-grid">
      <div class="stat-card">
        <p class="stat-label">Total</p>
        <p class="stat-value">{{ stats.total }}</p>
      </div>
      <div class="stat-card">
        <p class="stat-label">Activos</p>
        <p class="stat-value stat-success">{{ stats.active }}</p>
      </div>
      <div class="stat-card">
        <p class="stat-label">Administradores</p>
        <p class="stat-value stat-primary">{{ stats.admins }}</p>
      </div>
      <div class="stat-card">
        <p class="stat-label">Meseros</p>
        <p class="stat-value">{{ stats.waiters }}</p>
      </div>
      <div class="stat-card">
        <p class="stat-label">Cocina</p>
        <p class="stat-value stat-warning">{{ stats.kitchen }}</p>
      </div>
    </div>
    
    <!-- Filters -->
    <div class="card filters-card">
      <div class="filters-row">
        <!-- Search -->
        <div class="search-wrapper">
          <span class="material-symbols-outlined search-icon">search</span>
          <input 
            v-model="searchQuery"
            type="text" 
            placeholder="Buscar por nombre o email..." 
            class="search-input"
          />
        </div>
        
        <!-- Role Filter -->
        <div class="role-filters">
          <button
            v-for="role in roles"
            :key="role.value"
            @click="selectedRole = role.value"
            :class="['filter-btn', { 'filter-btn-active': selectedRole === role.value }]"
          >
            {{ role.label }}
          </button>
        </div>
      </div>
    </div>
    
    <!-- Employees Grid -->
    <div class="employees-grid">
      <div
        v-for="employee in filteredEmployees"
        :key="employee.id"
        :class="['employee-card', { 'employee-card-inactive': employee.status === 'inactive' }]"
      >
        <div class="employee-header">
          <!-- Avatar -->
          <div :class="['employee-avatar', `employee-avatar-${employee.role}`]">
            {{ employee.avatar }}
          </div>
          
          <!-- Info -->
          <div class="employee-info">
            <div class="employee-name-row">
              <h3 class="employee-name">{{ employee.name }}</h3>
              <span v-if="employee.status === 'inactive'" class="badge badge-danger">Inactivo</span>
            </div>
            <p class="employee-email">{{ employee.email }}</p>
            <div class="employee-meta">
              <span :class="['badge', getRoleInfo(employee.role).color]">
                {{ getRoleInfo(employee.role).label }}
              </span>
              <span class="employee-shift">{{ employee.shift }}</span>
            </div>
          </div>
        </div>
        
        <!-- Contact -->
        <div class="employee-footer">
          <div class="employee-phone">
            <span class="material-symbols-outlined">call</span>
            {{ employee.phone }}
          </div>
          
          <div class="employee-actions">
            <button @click="openEditModal(employee)" class="action-icon" title="Editar">
              <span class="material-symbols-outlined">edit</span>
            </button>
            <button 
              @click="toggleStatus(employee)" 
              :class="['action-icon', employee.status === 'active' ? 'action-icon-danger' : 'action-icon-success']"
              :title="employee.status === 'active' ? 'Desactivar' : 'Activar'"
            >
              <span class="material-symbols-outlined">{{ employee.status === 'active' ? 'block' : 'check_circle' }}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
    
    <!-- Empty state -->
    <div v-if="filteredEmployees.length === 0" class="card empty-state">
      <span class="material-symbols-outlined empty-icon">groups</span>
      <p>No se encontraron empleados</p>
    </div>
    
    <!-- Table View -->
    <div class="card table-card">
      <h3 class="card-title">Vista de Tabla</h3>
      <div class="table-container">
        <table class="data-table">
          <thead>
            <tr>
              <th>Empleado</th>
              <th>Email</th>
              <th>Telefono</th>
              <th>Rol</th>
              <th>Turno</th>
              <th>Estado</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="employee in filteredEmployees" :key="employee.id">
              <td>
                <div class="cell-employee">
                  <div :class="['mini-avatar', `mini-avatar-${employee.role}`]">
                    {{ employee.avatar }}
                  </div>
                  <span class="cell-name">{{ employee.name }}</span>
                </div>
              </td>
              <td class="cell-muted">{{ employee.email }}</td>
              <td class="cell-muted">{{ employee.phone }}</td>
              <td>
                <span :class="['badge', getRoleInfo(employee.role).color]">
                  {{ getRoleInfo(employee.role).label }}
                </span>
              </td>
              <td class="cell-muted">{{ employee.shift }}</td>
              <td>
                <span :class="['badge', employee.status === 'active' ? 'badge-success' : 'badge-danger']">
                  {{ employee.status === 'active' ? 'Activo' : 'Inactivo' }}
                </span>
              </td>
              <td>
                <div class="table-actions">
                  <button @click="openEditModal(employee)" class="btn btn-secondary btn-sm">
                    Editar
                  </button>
                  <button 
                    @click="toggleStatus(employee)" 
                    :class="employee.status === 'active' ? 'btn btn-danger btn-sm' : 'btn btn-primary btn-sm'"
                  >
                    {{ employee.status === 'active' ? 'Desactivar' : 'Activar' }}
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
    
    <!-- Modal -->
    <Teleport to="body">
      <div v-if="showModal" class="modal-overlay">
        <div @click="closeModal" class="modal-backdrop"></div>
        <div class="modal-content">
          <div class="modal-header">
            <h2 class="modal-title">
              {{ editingEmployee ? 'Editar Empleado' : 'Nuevo Empleado' }}
            </h2>
            <button @click="closeModal" class="modal-close">
              <span class="material-symbols-outlined">close</span>
            </button>
          </div>
          
          <form @submit.prevent="saveEmployee" class="modal-form">
            <div class="form-group">
              <label class="form-label">Nombre Completo</label>
              <input v-model="formData.name" type="text" class="input" placeholder="Juan Perez" required />
            </div>
            
            <div class="form-row">
              <div class="form-group">
                <label class="form-label">Email</label>
                <input v-model="formData.email" type="email" class="input" placeholder="email@restaurant.com" required />
              </div>
              <div class="form-group">
                <label class="form-label">Telefono</label>
                <input v-model="formData.phone" type="tel" class="input" placeholder="555-1234" required />
              </div>
            </div>
            
            <div class="form-row">
              <div class="form-group">
                <label class="form-label">Rol</label>
                <select v-model="formData.role" class="input">
                  <option v-for="role in roles.slice(1)" :key="role.value" :value="role.value">
                    {{ role.label }}
                  </option>
                </select>
              </div>
              <div class="form-group">
                <label class="form-label">Turno</label>
                <select v-model="formData.shift" class="input">
                  <option v-for="shift in shifts" :key="shift" :value="shift">{{ shift }}</option>
                </select>
              </div>
            </div>
            
            <div class="form-checkbox">
              <input 
                v-model="formData.status" 
                type="checkbox" 
                id="status" 
                true-value="active"
                false-value="inactive"
              />
              <label for="status">Empleado activo</label>
            </div>
            
            <div class="modal-actions">
              <button type="button" @click="closeModal" class="btn btn-secondary">Cancelar</button>
              <button type="submit" class="btn btn-primary">
                {{ editingEmployee ? 'Guardar Cambios' : 'Agregar Empleado' }}
              </button>
            </div>
          </form>
        </div>
      </div>
    </Teleport>
  </div>
</template>

<style scoped>
.employees-page {
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

/* Stats Grid */
.stats-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 1rem;
}

@media (min-width: 640px) {
  .stats-grid {
    grid-template-columns: repeat(5, 1fr);
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
.stat-primary { color: var(--primary); }
.stat-warning { color: var(--warning); }

/* Filters */
.filters-card {
  padding: 1rem 1.5rem;
}

.filters-row {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

@media (min-width: 640px) {
  .filters-row {
    flex-direction: row;
    align-items: center;
  }
}

.search-wrapper {
  flex: 1;
  position: relative;
}

.search-input {
  width: 100%;
  padding: 0.75rem 1rem 0.75rem 2.5rem;
  background: var(--surface-container);
  border: 1px solid var(--outline-variant);
  border-radius: var(--radius-lg);
  font-size: 0.875rem;
  color: var(--on-surface);
}

.search-input::placeholder {
  color: var(--on-surface-variant);
}

.search-input:focus {
  outline: none;
  border-color: var(--primary);
}

.search-icon {
  position: absolute;
  left: 0.75rem;
  top: 50%;
  transform: translateY(-50%);
  color: var(--on-surface-variant);
  font-size: 1.125rem;
}

.role-filters {
  display: flex;
  gap: 0.5rem;
}

.filter-btn {
  padding: 0.5rem 1rem;
  background: var(--surface-container-high);
  border: none;
  border-radius: var(--radius-lg);
  font-size: 0.875rem;
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

/* Employees Grid */
.employees-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: 1rem;
}

@media (min-width: 640px) {
  .employees-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (min-width: 1024px) {
  .employees-grid {
    grid-template-columns: repeat(3, 1fr);
  }
}

.employee-card {
  background: var(--surface-container-lowest);
  border: 1px solid var(--outline-variant);
  border-radius: var(--radius-xl);
  padding: 1.5rem;
}

.employee-card-inactive {
  opacity: 0.6;
}

.employee-header {
  display: flex;
  gap: 1rem;
}

.employee-avatar {
  width: 3.5rem;
  height: 3.5rem;
  border-radius: var(--radius-full);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.125rem;
  font-weight: 700;
  flex-shrink: 0;
}

.employee-avatar-admin {
  background: rgba(0, 52, 43, 0.2);
  color: var(--primary);
}

.employee-avatar-waiter {
  background: rgba(34, 197, 94, 0.2);
  color: var(--success);
}

.employee-avatar-kitchen {
  background: rgba(245, 158, 11, 0.2);
  color: var(--warning);
}

.employee-info {
  flex: 1;
  min-width: 0;
}

.employee-name-row {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 0.25rem;
}

.employee-name {
  font-size: 1rem;
  font-weight: 600;
  color: var(--on-surface);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.employee-email {
  font-size: 0.875rem;
  color: var(--on-surface-variant);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.employee-meta {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-top: 0.5rem;
}

.employee-shift {
  font-size: 0.75rem;
  color: var(--on-surface-variant);
}

.employee-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-top: 1rem;
  padding-top: 1rem;
  border-top: 1px solid var(--outline-variant);
}

.employee-phone {
  display: flex;
  align-items: center;
  gap: 0.25rem;
  font-size: 0.875rem;
  color: var(--on-surface-variant);
}

.employee-phone .material-symbols-outlined {
  font-size: 1rem;
}

.employee-actions {
  display: flex;
  gap: 0.5rem;
}

.action-icon {
  padding: 0.5rem;
  background: transparent;
  border: none;
  color: var(--on-surface-variant);
  cursor: pointer;
  border-radius: var(--radius);
  transition: all var(--transition-base);
}

.action-icon:hover {
  color: var(--on-surface);
}

.action-icon-danger:hover {
  color: var(--danger);
}

.action-icon-success:hover {
  color: var(--success);
}

.action-icon .material-symbols-outlined {
  font-size: 1.125rem;
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

/* Table Card */
.table-card {
  margin-top: 1rem;
}

.card-title {
  font-weight: 600;
  color: var(--on-surface);
  margin-bottom: 1rem;
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

.cell-employee {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.mini-avatar {
  width: 2rem;
  height: 2rem;
  border-radius: var(--radius-full);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.875rem;
  font-weight: 700;
}

.mini-avatar-admin {
  background: rgba(0, 52, 43, 0.2);
  color: var(--primary);
}

.mini-avatar-waiter {
  background: rgba(34, 197, 94, 0.2);
  color: var(--success);
}

.mini-avatar-kitchen {
  background: rgba(245, 158, 11, 0.2);
  color: var(--warning);
}

.cell-name {
  font-weight: 500;
  color: var(--on-surface);
}

.cell-muted {
  color: var(--on-surface-variant);
}

.table-actions {
  display: flex;
  gap: 0.5rem;
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

.form-row {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 1rem;
}

.form-checkbox {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.form-checkbox input {
  width: 1rem;
  height: 1rem;
}

.form-checkbox label {
  font-size: 0.875rem;
  color: var(--on-surface);
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

.badge-primary {
  background: rgba(0, 52, 43, 0.15);
  color: var(--primary);
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

.btn-danger {
  background: var(--error);
  color: white;
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
