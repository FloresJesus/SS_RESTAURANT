<script setup>
import { ref, computed, onMounted } from 'vue'
import { useCustomersStore } from '@/stores/customers'

const customersStore = useCustomersStore()

const searchQuery = ref('')
const showModal = ref(false)
const editingCustomer = ref(null)

const formData = ref({
  nombre: '',
  telefono: '',
  correo: '',
  notas: ''
})

const customers = computed(() => {
  return customersStore.customers.map(customer => ({
    ...customer,
    avatar: customer.nombre.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
  }))
})

const filteredCustomers = computed(() => {
  const searchText = searchQuery.value.toLowerCase()

  return customers.value.filter(customer => {
    const matchesSearch = customer.nombre.toLowerCase().includes(searchText) ||
                          (customer.correo && customer.correo.toLowerCase().includes(searchText)) ||
                          customer.telefono.includes(searchText)
    return matchesSearch
  })
})

const stats = computed(() => ({
  total: customers.value.length,
  withEmail: customers.value.filter(c => c.correo).length,
  withNotes: customers.value.filter(c => c.notas).length
}))

const loadCustomers = async () => {
  await customersStore.fetchCustomers()
}

onMounted(loadCustomers)

const openAddModal = () => {
  editingCustomer.value = null
  formData.value = {
    nombre: '',
    telefono: '',
    correo: '',
    notas: ''
  }
  showModal.value = true
}

const openEditModal = (customer) => {
  editingCustomer.value = customer
  formData.value = {
    nombre: customer.nombre,
    telefono: customer.telefono,
    correo: customer.correo || '',
    notas: customer.notas || ''
  }
  showModal.value = true
}

const closeModal = () => {
  showModal.value = false
  editingCustomer.value = null
}

const saveCustomer = async () => {
  const payload = {
    nombre: formData.value.nombre,
    telefono: formData.value.telefono,
    correo: formData.value.correo || null,
    notas: formData.value.notas || null
  }

  try {
    let response
    if (editingCustomer.value) {
      response = await fetch(`http://localhost:3000/api/customers/${editingCustomer.value.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })
    } else {
      response = await fetch('http://localhost:3000/api/customers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })
    }

    if (!response.ok) {
      const errorData = await response.json().catch(() => null)
      throw new Error(errorData?.message || 'Error al guardar cliente')
    }

    await loadCustomers()
    closeModal()
  } catch (error) {
    console.error('Error guardando cliente:', error)
  }
}

const deleteCustomer = async (customer) => {
  if (!confirm(`¿Estás seguro de eliminar a ${customer.nombre}?`)) return

  try {
    const response = await fetch(`http://localhost:3000/api/customers/${customer.id}`, {
      method: 'DELETE'
    })

    if (!response.ok) {
      throw new Error('Error al eliminar cliente')
    }

    await loadCustomers()
  } catch (error) {
    console.error('Error eliminando cliente:', error)
  }
}
</script>

<template>
  <div class="customers-page">
    <!-- Header -->
    <div class="page-header">
      <div class="header-info">
        <h1 class="page-title">Gestión de Clientes</h1>
        <p class="page-subtitle">Administra la base de clientes</p>
      </div>
      <button @click="openAddModal" class="btn btn-primary">
        <span class="material-symbols-outlined">person_add</span>
        Agregar Cliente
      </button>
    </div>

    <!-- Stats -->
    <div class="stats-grid">
      <div class="stat-card">
        <p class="stat-label">Total</p>
        <p class="stat-value">{{ stats.total }}</p>
      </div>
      <div class="stat-card">
        <p class="stat-label">Con Email</p>
        <p class="stat-value stat-success">{{ stats.withEmail }}</p>
      </div>
      <div class="stat-card">
        <p class="stat-label">Con Notas</p>
        <p class="stat-value stat-primary">{{ stats.withNotes }}</p>
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
            placeholder="Buscar por nombre, email o teléfono..."
            class="search-input"
          />
        </div>
      </div>
    </div>

    <!-- Customers Grid -->
    <div class="customers-grid">
      <div
        v-for="customer in filteredCustomers"
        :key="customer.id"
        class="customer-card"
      >
        <div class="customer-header">
          <!-- Avatar -->
          <div class="customer-avatar">
            {{ customer.avatar }}
          </div>

          <!-- Info -->
          <div class="customer-info">
            <div class="customer-name-row">
              <h3 class="customer-name">{{ customer.nombre }}</h3>
            </div>
            <p class="customer-email">{{ customer.correo || 'Sin email' }}</p>
            <div class="customer-meta">
              <span class="customer-phone">
                <span class="material-symbols-outlined">call</span>
                {{ customer.telefono }}
              </span>
            </div>
          </div>
        </div>

        <!-- Notes -->
        <div v-if="customer.notas" class="customer-notes">
          <p>{{ customer.notas }}</p>
        </div>

        <!-- Actions -->
        <div class="customer-footer">
          <div class="customer-actions">
            <button @click="openEditModal(customer)" class="action-icon" title="Editar">
              <span class="material-symbols-outlined">edit</span>
            </button>
            <button
              @click="deleteCustomer(customer)"
              class="action-icon action-icon-danger"
              title="Eliminar"
            >
              <span class="material-symbols-outlined">delete</span>
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Empty state -->
    <div v-if="filteredCustomers.length === 0" class="card empty-state">
      <span class="material-symbols-outlined empty-icon">groups</span>
      <p>No se encontraron clientes</p>
    </div>

    <!-- Table View -->
    <div class="card table-card">
      <h3 class="card-title">Vista de Tabla</h3>
      <div class="table-container">
        <table class="data-table">
          <thead>
            <tr>
              <th>Cliente</th>
              <th>Teléfono</th>
              <th>Email</th>
              <th>Notas</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="customer in filteredCustomers" :key="customer.id">
              <td>
                <div class="cell-customer">
                  <div class="mini-avatar">
                    {{ customer.avatar }}
                  </div>
                  <span class="cell-name">{{ customer.nombre }}</span>
                </div>
              </td>
              <td class="cell-muted">{{ customer.telefono }}</td>
              <td class="cell-muted">{{ customer.correo || '-' }}</td>
              <td class="cell-notes">{{ customer.notas || '-' }}</td>
              <td>
                <div class="table-actions">
                  <button @click="openEditModal(customer)" class="btn btn-secondary btn-sm">
                    Editar
                  </button>
                  <button
                    @click="deleteCustomer(customer)"
                    class="btn btn-danger btn-sm"
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

    <!-- Modal -->
    <Teleport to="body">
      <div v-if="showModal" class="modal-overlay">
        <div @click="closeModal" class="modal-backdrop"></div>
        <div class="modal-content">
          <div class="modal-header">
            <h2 class="modal-title">
              {{ editingCustomer ? 'Editar Cliente' : 'Nuevo Cliente' }}
            </h2>
            <button @click="closeModal" class="modal-close">
              <span class="material-symbols-outlined">close</span>
            </button>
          </div>

          <form @submit.prevent="saveCustomer" class="modal-form">
            <div class="form-row">
              <div class="form-group">
                <label class="form-label">Nombre</label>
                <input v-model="formData.nombre" type="text" class="input" placeholder="Juan Pérez" required />
              </div>
              <div class="form-group">
                <label class="form-label">Teléfono</label>
                <input v-model="formData.telefono" type="tel" class="input" placeholder="555-123-4567" required />
              </div>
            </div>

            <div class="form-row">
              <div class="form-group">
                <label class="form-label">Email</label>
                <input v-model="formData.correo" type="email" class="input" placeholder="cliente@email.com" />
              </div>
            </div>

            <div class="form-group">
              <label class="form-label">Notas</label>
              <textarea v-model="formData.notas" class="input textarea" placeholder="Notas adicionales sobre el cliente..." rows="3"></textarea>
            </div>

            <div class="modal-actions">
              <button type="button" @click="closeModal" class="btn btn-secondary">Cancelar</button>
              <button type="submit" class="btn btn-primary">
                {{ editingCustomer ? 'Guardar Cambios' : 'Agregar Cliente' }}
              </button>
            </div>
          </form>
        </div>
      </div>
    </Teleport>
  </div>
</template>

<style scoped>
.customers-page {
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
    grid-template-columns: repeat(3, 1fr);
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

/* Customers Grid */
.customers-grid {
  display: grid;
  grid-template-columns: repeat(1, 1fr);
  gap: 1rem;
}

@media (min-width: 768px) {
  .customers-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (min-width: 1024px) {
  .customers-grid {
    grid-template-columns: repeat(3, 1fr);
  }
}

.customer-card {
  background: var(--surface-container-lowest);
  border: 1px solid var(--outline-variant);
  border-radius: var(--radius-xl);
  padding: 1.5rem;
}

.customer-header {
  display: flex;
  gap: 1rem;
}

.customer-avatar {
  width: 3.5rem;
  height: 3.5rem;
  border-radius: var(--radius-full);
  background: rgba(34, 197, 94, 0.2);
  color: var(--success);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.125rem;
  font-weight: 700;
  flex-shrink: 0;
}

.customer-info {
  flex: 1;
  min-width: 0;
}

.customer-name-row {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 0.25rem;
}

.customer-name {
  font-size: 1rem;
  font-weight: 600;
  color: var(--on-surface);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.customer-email {
  font-size: 0.875rem;
  color: var(--on-surface-variant);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.customer-meta {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-top: 0.5rem;
}

.customer-phone {
  display: flex;
  align-items: center;
  gap: 0.25rem;
  font-size: 0.875rem;
  color: var(--on-surface-variant);
}

.customer-phone .material-symbols-outlined {
  font-size: 1rem;
}

.customer-notes {
  margin-top: 1rem;
  padding: 1rem;
  background: var(--surface-container);
  border-radius: var(--radius-lg);
}

.customer-notes p {
  font-size: 0.875rem;
  color: var(--on-surface-variant);
  margin: 0;
}

.customer-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-top: 1rem;
  padding-top: 1rem;
  border-top: 1px solid var(--outline-variant);
}

.customer-actions {
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
  color: var(--error);
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

.cell-customer {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.mini-avatar {
  width: 2rem;
  height: 2rem;
  border-radius: var(--radius-full);
  background: rgba(34, 197, 94, 0.2);
  color: var(--success);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.875rem;
  font-weight: 700;
}

.cell-name {
  font-weight: 500;
  color: var(--on-surface);
}

.cell-muted {
  color: var(--on-surface-variant);
}

.cell-notes {
  max-width: 200px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
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
  background: rgba(0, 0, 0, 0.5);
}

.modal-content {
  position: relative;
  background: var(--surface-container-lowest);
  border-radius: var(--radius-xl);
  width: 100%;
  max-width: 500px;
  max-height: 90vh;
  overflow-y: auto;
}

.modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1.5rem;
  border-bottom: 1px solid var(--outline-variant);
}

.modal-title {
  font-size: 1.25rem;
  font-weight: 600;
  color: var(--on-surface);
  margin: 0;
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
  padding: 1.5rem;
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.form-row {
  display: flex;
  gap: 1rem;
}

.form-group {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.form-label {
  font-size: 0.875rem;
  font-weight: 500;
  color: var(--on-surface);
}

.input {
  padding: 0.75rem;
  background: var(--surface-container);
  border: 1px solid var(--outline-variant);
  border-radius: var(--radius-lg);
  font-family: var(--font-body);
  font-size: 0.875rem;
  color: var(--on-surface);
  transition: all var(--transition-base);
}

.input:focus {
  outline: none;
  border-color: var(--primary);
  box-shadow: 0 0 0 2px rgba(0, 52, 43, 0.1);
}

.input::placeholder {
  color: var(--on-surface-variant);
}

.textarea {
  resize: vertical;
  min-height: 80px;
}

.modal-actions {
  display: flex;
  gap: 0.75rem;
  justify-content: flex-end;
  margin-top: 1rem;
}

.btn {
  padding: 0.75rem 1.5rem;
  border: none;
  border-radius: var(--radius-lg);
  font-family: var(--font-body);
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
  transition: all var(--transition-base);
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
}

.btn-primary {
  background: var(--primary);
  color: var(--on-primary);
}

.btn-primary:hover {
  background: var(--primary-container);
  color: var(--on-primary-container);
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
  color: var(--on-error);
}

.btn-danger:hover {
  background: var(--error-container);
  color: var(--on-error-container);
}

.btn-sm {
  padding: 0.5rem 1rem;
  font-size: 0.75rem;
}
</style>