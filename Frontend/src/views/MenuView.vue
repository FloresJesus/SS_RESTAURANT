<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRestaurantStore } from '@/stores/restaurant'
import { useAuthStore } from '@/stores/auth'

const store = useRestaurantStore()
const authStore = useAuthStore()

const userRole = computed(() => authStore.user?.rol || '')
const isAdmin = computed(() => userRole.value === 'admin')

const searchQuery = ref('')
const selectedCategory = ref('all')
const showModal = ref(false)
const editingItem = ref(null)
const imageFile = ref(null)
const imagePreview = ref('')

const categories = computed(() => ['all', ...store.categories.map(c => c.nombre)])

const formData = ref({
  nombre: '',
  categoria_id: null,
  categoria: '',
  precio: '',
  descripcion: '',
  disponible: true,
  imagen_url: null
})

const filteredItems = computed(() => {
  return store.menuItems.filter(item => {
    const matchesSearch = item.nombre.toLowerCase().includes(searchQuery.value.toLowerCase())
    const matchesCategory = selectedCategory.value === 'all' || item.categoria_nombre === selectedCategory.value
    return matchesSearch && matchesCategory
  })
})

const formatCurrency = (value) => {
  return `Bs ${Number(value).toFixed(2)}`
}

const resizeImage = (file, maxWidth = 800, maxHeight = 600, quality = 0.8) => {
  return new Promise((resolve) => {
    const reader = new FileReader()
    reader.onload = (e) => {
      const img = new Image()
      img.onload = () => {
        const canvas = document.createElement('canvas')
        let width = img.width
        let height = img.height
        if (width > maxWidth) {
          height = (height * maxWidth) / width
          width = maxWidth
        }
        if (height > maxHeight) {
          width = (width * maxHeight) / height
          height = maxHeight
        }
        canvas.width = width
        canvas.height = height
        const ctx = canvas.getContext('2d')
        ctx.drawImage(img, 0, 0, width, height)
        canvas.toBlob((blob) => {
          const resizedFile = new File([blob], file.name, { type: 'image/jpeg' })
          resolve(resizedFile)
        }, 'image/jpeg', quality)
      }
      img.src = e.target.result
    }
    reader.readAsDataURL(file)
  })
}

const openAddModal = () => {
  editingItem.value = null
  imageFile.value = null
  imagePreview.value = ''
  formData.value = {
    nombre: '',
    categoria_id: null,
    categoria: '',
    precio: '',
    descripcion: '',
    disponible: true,
    imagen_url: null
  }
  showModal.value = true
}

const openEditModal = (item) => {
  editingItem.value = item
  imageFile.value = null
  imagePreview.value = item.imagen_url || ''
  formData.value = {
    nombre: item.nombre,
    categoria_id: item.categoria_id,
    categoria: item.categoria_nombre || '',
    precio: item.precio,
    descripcion: item.descripcion || '',
    disponible: item.disponible,
    imagen_url: item.imagen_url
  }
  showModal.value = true
}

const closeModal = () => {
  showModal.value = false
  editingItem.value = null
  imageFile.value = null
  imagePreview.value = ''
}

const removeImage = () => {
  imageFile.value = null
  imagePreview.value = ''
  formData.value.imagen = null
}

const onFileChange = async (event) => {
  const file = event.target.files?.[0]
  if (!file) {
    imageFile.value = null
    imagePreview.value = ''
    return
  }
  const resized = await resizeImage(file)
  imageFile.value = resized
  imagePreview.value = URL.createObjectURL(resized)
}

const saveItem = async () => {
  const categoria = store.categories.find(c => c.nombre === formData.value.categoria)
  const payload = {
    nombre: formData.value.nombre,
    categoria_id: categoria?.id || null,
    descripcion: formData.value.descripcion || '',
    precio: Number(formData.value.precio),
    disponible: Boolean(formData.value.disponible),
    imageFile: imageFile.value
  }

  try {
    if (editingItem.value) {
      await store.updateMenuItem(editingItem.value.id, payload)
    } else {
      await store.addMenuItem(payload)
    }
    closeModal()
  } catch (error) {
    console.error('Error guardando platillo:', error)
    alert(error.message || 'Error al guardar platillo')
  }
}

const deleteItem = async (id) => {
  if (!confirm('¿Estas seguro de eliminar este platillo?')) return
  try {
    await store.deleteMenuItem(id)
  } catch (error) {
    console.error('Error eliminando platillo:', error)
    alert(error.message || 'Error al eliminar platillo')
  }
}

const toggleAvailability = async (item) => {
  try {
    await store.updateMenuItem(item.id, {
      nombre: item.nombre,
      categoria_id: item.categoria_id,
      descripcion: item.descripcion,
      precio: item.precio,
      disponible: !item.disponible
    })
  } catch (error) {
    console.error('Error actualizando platillo:', error)
    alert(error.message || 'Error al actualizar platillo')
  }
}

onMounted(async () => {
  await store.loadCategories()
  await store.loadMenuItems()
})
</script>

<template>
  <div class="menu-page">
    <!-- Header -->
    <div class="page-header">
      <div class="header-info">
        <h1 class="page-title">Gestion de Menu</h1>
        <p class="page-subtitle">Administra los platillos de tu restaurante</p>
      </div>
      <button v-if="isAdmin" @click="openAddModal" class="btn btn-primary">
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
        :class="['menu-card', { 'menu-card-unavailable': !item.disponible }]"
      >
        <div class="menu-card-image">
          <img v-if="item.imagen_url" :src="item.imagen_url" alt="Platillo" class="menu-card-image-inner" />
          <span v-else class="material-symbols-outlined">restaurant</span>
        </div>
        
        <!-- Content -->
        <div class="menu-card-content">
          <div class="menu-card-header">
            <h3 class="menu-card-title">{{ item.nombre }}</h3>
            <span :class="['badge', item.disponible ? 'badge-success' : 'badge-danger']">
              {{ item.disponible ? 'Disponible' : 'Agotado' }}
            </span>
          </div>
          
          <p class="menu-card-description">{{ item.descripcion }}</p>
          
          <div class="menu-card-footer">
            <span class="menu-card-price">{{ formatCurrency(item.precio) }}</span>
            <span class="menu-card-category">{{ item.categoria_nombre }}</span>
          </div>
        </div>
        
        <!-- Actions overlay -->
        <div v-if="isAdmin" class="menu-card-overlay">
          <button @click="openEditModal(item)" class="btn btn-secondary btn-sm">
            <span class="material-symbols-outlined">edit</span>
            Editar
          </button>
          <button @click="toggleAvailability(item)" class="btn btn-secondary btn-sm">
            <span class="material-symbols-outlined">{{ item.disponible ? 'block' : 'check' }}</span>
            {{ item.disponible ? 'Agotar' : 'Activar' }}
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
              <input v-model="formData.nombre" type="text" class="input" placeholder="Nombre del platillo" required />
            </div>
            
            <div class="form-row">
              <div class="form-group">
                <label class="form-label">Categoria</label>
                <select v-model="formData.categoria" class="input">
                  <option value="">Sin categoria</option>
                  <option v-for="cat in store.categories" :key="cat.id" :value="cat.nombre">{{ cat.nombre }}</option>
                </select>
              </div>
              <div class="form-group">
                <label class="form-label">Precio (Bs)</label>
                <input v-model="formData.precio" type="number" step="0.01" class="input" placeholder="0.00" required />
              </div>
            </div>
            
            <div class="form-group">
              <label class="form-label">Descripcion</label>
              <textarea v-model="formData.descripcion" class="input textarea" placeholder="Descripcion del platillo"></textarea>
            </div>

            <div class="form-group">
              <label class="form-label">Imagen del platillo</label>
              <input @change="onFileChange" type="file" accept="image/*" class="input" />
              <div v-if="imagePreview" class="image-preview">
                <img :src="imagePreview" alt="Vista previa" />
                <button type="button" @click="removeImage" class="remove-image-btn">
                  <span class="material-symbols-outlined">close</span>
                </button>
              </div>
            </div>
            
            <div class="form-checkbox">
              <input v-model="formData.disponible" type="checkbox" id="disponible" />
              <label for="disponible">Disponible</label>
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
  overflow: hidden;
}

.menu-card-image-inner {
  width: 100%;
  height: 100%;
  object-fit: cover;
  border-radius: var(--radius-lg);
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
  max-height: 90vh;
  overflow-y: auto;
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

/* Image Preview */
.image-preview {
  position: relative;
  margin-top: 0.75rem;
  border-radius: var(--radius-lg);
  overflow: hidden;
  border: 1px solid var(--outline-variant);
  max-height: 200px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--surface-container);
}

.image-preview img {
  max-width: 100%;
  max-height: 200px;
  object-fit: contain;
  display: block;
}

.remove-image-btn {
  position: absolute;
  top: 0.5rem;
  right: 0.5rem;
  background: rgba(0, 0, 0, 0.6);
  border: none;
  border-radius: var(--radius-full);
  color: white;
  cursor: pointer;
  padding: 0.25rem;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background var(--transition-base);
}

.remove-image-btn:hover {
  background: rgba(186, 26, 26, 0.8);
}

.remove-image-btn .material-symbols-outlined {
  font-size: 1.25rem;
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
