<script setup>
import { ref, computed } from 'vue'
import { useRestaurantStore } from '@/stores/restaurant'

const store = useRestaurantStore()

const searchQuery = ref('')
const selectedCategory = ref('all')
const showModal = ref(false)
const editingItem = ref(null)

const categories = ['all', 'Platos Principales', 'Entradas', 'Postres', 'Bebidas']

const formData = ref({
  name: '',
  category: 'Platos Principales',
  price: '',
  description: '',
  available: true
})

const filteredItems = computed(() => {
  return store.menuItems.filter(item => {
    const matchesSearch = item.name.toLowerCase().includes(searchQuery.value.toLowerCase())
    const matchesCategory = selectedCategory.value === 'all' || item.category === selectedCategory.value
    return matchesSearch && matchesCategory
  })
})

const formatCurrency = (value) => {
  return new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'BOB' }).format(value)
}

const openAddModal = () => {
  editingItem.value = null
  formData.value = {
    name: '',
    category: 'Platos Principales',
    price: '',
    description: '',
    available: true
  }
  showModal.value = true
}

const openEditModal = (item) => {
  editingItem.value = item
  formData.value = { ...item }
  showModal.value = true
}

const closeModal = () => {
  showModal.value = false
  editingItem.value = null
}

const saveItem = () => {
  if (editingItem.value) {
    store.updateMenuItem(editingItem.value.id, { ...formData.value, price: Number(formData.value.price) })
  } else {
    store.addMenuItem({ ...formData.value, price: Number(formData.value.price) })
  }
  closeModal()
}

const deleteItem = (id) => {
  if (confirm('Estas seguro de eliminar este platillo?')) {
    store.deleteMenuItem(id)
  }
}

const toggleAvailability = (item) => {
  store.updateMenuItem(item.id, { available: !item.available })
}
</script>

<template>
  <div class="menu-page">
    <!-- Header -->
    <div class="page-header">
      <div class="header-info">
        <h1 class="page-title">Gestion de Menu</h1>
        <p class="page-subtitle">Administra los platillos de tu restaurante</p>
      </div>
      <button @click="openAddModal" class="btn btn-primary">
        <span class="material-symbols-outlined">add</span>
        Agregar Platillo
      </button>
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
            placeholder="Buscar platillos..." 
            class="search-input"
          />
        </div>
        
        <!-- Category Filter -->
        <div class="category-filters">
          <button
            v-for="cat in categories"
            :key="cat"
            @click="selectedCategory = cat"
            :class="['filter-btn', { 'filter-btn-active': selectedCategory === cat }]"
          >
            {{ cat === 'all' ? 'Todos' : cat }}
          </button>
        </div>
      </div>
    </div>
    
    <!-- Menu Grid -->
    <div class="menu-grid">
      <div
        v-for="item in filteredItems"
        :key="item.id"
        :class="['menu-card', { 'menu-card-unavailable': !item.available }]"
      >
        <!-- Image placeholder -->
        <div class="menu-card-image">
          <span class="material-symbols-outlined">restaurant</span>
        </div>
        
        <!-- Content -->
        <div class="menu-card-content">
          <div class="menu-card-header">
            <h3 class="menu-card-title">{{ item.name }}</h3>
            <span :class="['badge', item.available ? 'badge-success' : 'badge-danger']">
              {{ item.available ? 'Disponible' : 'Agotado' }}
            </span>
          </div>
          
          <p class="menu-card-description">{{ item.description }}</p>
          
          <div class="menu-card-footer">
            <span class="menu-card-price">{{ formatCurrency(item.price) }}</span>
            <span class="menu-card-category">{{ item.category }}</span>
          </div>
        </div>
        
        <!-- Actions overlay -->
        <div class="menu-card-overlay">
          <button @click="openEditModal(item)" class="btn btn-secondary btn-sm">
            <span class="material-symbols-outlined">edit</span>
            Editar
          </button>
          <button @click="toggleAvailability(item)" class="btn btn-secondary btn-sm">
            <span class="material-symbols-outlined">{{ item.available ? 'block' : 'check' }}</span>
            {{ item.available ? 'Agotar' : 'Activar' }}
          </button>
          <button @click="deleteItem(item.id)" class="btn btn-danger btn-sm">
            <span class="material-symbols-outlined">delete</span>
          </button>
        </div>
      </div>
    </div>
    
    <!-- Empty state -->
    <div v-if="filteredItems.length === 0" class="card empty-state">
      <span class="material-symbols-outlined empty-icon">restaurant_menu</span>
      <p>No se encontraron platillos</p>
    </div>
    
    <!-- Modal -->
    <Teleport to="body">
      <div v-if="showModal" class="modal-overlay">
        <div @click="closeModal" class="modal-backdrop"></div>
        <div class="modal-content">
          <div class="modal-header">
            <h2 class="modal-title">
              {{ editingItem ? 'Editar Platillo' : 'Nuevo Platillo' }}
            </h2>
            <button @click="closeModal" class="modal-close">
              <span class="material-symbols-outlined">close</span>
            </button>
          </div>
          
          <form @submit.prevent="saveItem" class="modal-form">
            <div class="form-group">
              <label class="form-label">Nombre</label>
              <input v-model="formData.name" type="text" class="input" placeholder="Nombre del platillo" required />
            </div>
            
            <div class="form-row">
              <div class="form-group">
                <label class="form-label">Categoria</label>
                <select v-model="formData.category" class="input">
                  <option v-for="cat in categories.slice(1)" :key="cat" :value="cat">{{ cat }}</option>
                </select>
              </div>
              <div class="form-group">
                <label class="form-label">Precio (MXN)</label>
                <input v-model="formData.price" type="number" step="0.01" class="input" placeholder="0.00" required />
              </div>
            </div>
            
            <div class="form-group">
              <label class="form-label">Descripcion</label>
              <textarea v-model="formData.description" class="input textarea" placeholder="Descripcion del platillo"></textarea>
            </div>
            
            <div class="form-checkbox">
              <input v-model="formData.available" type="checkbox" id="available" />
              <label for="available">Disponible</label>
            </div>
            
            <div class="modal-actions">
              <button type="button" @click="closeModal" class="btn btn-secondary">Cancelar</button>
              <button type="submit" class="btn btn-primary">
                {{ editingItem ? 'Guardar Cambios' : 'Agregar Platillo' }}
              </button>
            </div>
          </form>
        </div>
      </div>
    </Teleport>
  </div>
</template>

<style scoped>
.menu-page {
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

.category-filters {
  display: flex;
  gap: 0.5rem;
  overflow-x: auto;
  padding-bottom: 0.5rem;
}

@media (min-width: 640px) {
  .category-filters {
    padding-bottom: 0;
  }
}

.filter-btn {
  padding: 0.5rem 1rem;
  background: var(--surface-container-high);
  border: none;
  border-radius: var(--radius-lg);
  font-size: 0.875rem;
  font-weight: 500;
  color: var(--on-surface-variant);
  white-space: nowrap;
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

/* Menu Grid */
.menu-grid {
  display: grid;
  grid-template-columns: repeat(1, 1fr);
  gap: 1rem;
}

@media (min-width: 640px) {
  .menu-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (min-width: 1024px) {
  .menu-grid {
    grid-template-columns: repeat(3, 1fr);
  }
}

@media (min-width: 1280px) {
  .menu-grid {
    grid-template-columns: repeat(4, 1fr);
  }
}

.menu-card {
  background: var(--surface-container-lowest);
  border: 1px solid var(--outline-variant);
  border-radius: var(--radius-xl);
  padding: 1rem;
  position: relative;
  overflow: hidden;
  transition: all var(--transition-base);
}

.menu-card-unavailable {
  opacity: 0.6;
}

.menu-card-image {
  aspect-ratio: 16/9;
  background: linear-gradient(135deg, var(--surface-container-high) 0%, var(--surface-container) 100%);
  border-radius: var(--radius-lg);
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 1rem;
}

.menu-card-image .material-symbols-outlined {
  font-size: 3rem;
  color: var(--outline-variant);
}

.menu-card-content {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.menu-card-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 0.5rem;
}

.menu-card-title {
  font-size: 1rem;
  font-weight: 600;
  color: var(--on-surface);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.menu-card-description {
  font-size: 0.75rem;
  color: var(--on-surface-variant);
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.menu-card-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-top: 0.5rem;
}

.menu-card-price {
  font-size: 1.125rem;
  font-weight: 700;
  color: var(--primary);
}

.menu-card-category {
  font-size: 0.75rem;
  color: var(--on-surface-variant);
  background: var(--surface-container-high);
  padding: 0.25rem 0.5rem;
  border-radius: var(--radius);
}

/* Overlay */
.menu-card-overlay {
  position: absolute;
  inset: 0;
  background: rgba(248, 250, 249, 0.9);
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  opacity: 0;
  transition: opacity var(--transition-base);
}

.menu-card:hover .menu-card-overlay {
  opacity: 1;
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

.form-row {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 1rem;
}

.textarea {
  min-height: 100px;
  resize: vertical;
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

.badge-success {
  background: rgba(34, 197, 94, 0.15);
  color: var(--success);
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
