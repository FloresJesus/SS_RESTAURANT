<script setup>
import { ref, computed, onMounted } from 'vue'
import { apiFetch, API_BASE } from '@/utils/api'
import { required, isPhone, isNumeric, composeValidators } from '@/utils/validators'
import { useFormValidation } from '@/composables/useFormValidation'
import FormField from '@/components/FormField.vue'

const settings = ref({
  nombre_restaurante: '',
  direccion: '',
  telefono: '',
  nit: ''
})

const loading = ref(true)
const saving = ref(false)
const message = ref('')
const messageType = ref('')

const { validateField, touchField, validateAll, getError, resetValidation } = useFormValidation({
  nombre_restaurante: {
    rules: [required('El nombre del restaurante es obligatorio')],
    value: computed(() => settings.value.nombre_restaurante)
  },
  telefono: {
    rules: [isPhone()],
    value: computed(() => settings.value.telefono)
  }
})

const loadSettings = async () => {
  try {
    const data = await apiFetch(`${API_BASE}/settings`)
    settings.value = {
      nombre_restaurante: data.nombre_restaurante || '',
      direccion: data.direccion || '',
      telefono: data.telefono || '',
      nit: data.nit || ''
    }
  } catch (error) {
    message.value = 'Error al cargar configuracion'
    messageType.value = 'error'
  } finally {
    loading.value = false
  }
}

const saveSettings = async () => {
  if (!validateAll()) return

  saving.value = true
  message.value = ''

  try {
    await apiFetch(`${API_BASE}/settings`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(settings.value)
    })
    message.value = 'Configuracion guardada correctamente'
    messageType.value = 'success'
  } catch (error) {
    message.value = 'Error al guardar configuracion'
    messageType.value = 'error'
  } finally {
    saving.value = false
  }
}

onMounted(() => {
  loadSettings()
})
</script>

<template>
  <div class="settings-page">
    <div class="page-header">
      <div class="header-info">
        <h1 class="page-title">Configuracion</h1>
        <p class="page-subtitle">Administra la informacion del restaurante</p>
      </div>
    </div>

    <div v-if="loading" class="loading-state">
      <p>Cargando configuracion...</p>
    </div>

    <div v-else class="card">
      <div v-if="message" :class="['alert', `alert-${messageType}`]">
        <span class="material-symbols-outlined">{{ messageType === 'success' ? 'check_circle' : 'error' }}</span>
        {{ message }}
      </div>

      <form @submit.prevent="saveSettings" class="settings-form">
        <FormField
          v-model="settings.nombre_restaurante"
          label="Nombre del Restaurante"
          placeholder="SAN SALVADOR"
          required
          :error="getError('nombre_restaurante')"
          @blur="touchField('nombre_restaurante')"
        />

        <FormField
          v-model="settings.direccion"
          label="Dirección"
          placeholder="Direccion del restaurante"
        />

        <div class="form-row">
          <FormField
            v-model="settings.telefono"
            label="Teléfono"
            type="tel"
            placeholder="Telefono"
            :error="getError('telefono')"
            @blur="touchField('telefono')"
          />
          <FormField
            v-model="settings.nit"
            label="NIT"
            placeholder="NIT"
          />
        </div>

        <div class="form-actions">
          <button type="submit" class="btn btn-primary" :disabled="saving">
            <span v-if="saving" class="material-symbols-outlined">hourglass_top</span>
            <span v-else class="material-symbols-outlined">save</span>
            {{ saving ? 'Guardando...' : 'Guardar Cambios' }}
          </button>
        </div>
      </form>
    </div>
  </div>
</template>

<style scoped>
.settings-page {
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

.loading-state {
  text-align: center;
  padding: 3rem;
  color: var(--on-surface-variant);
}

.card {
  background: var(--surface-container-lowest);
  border: 1px solid var(--outline-variant);
  border-radius: var(--radius-xl);
  padding: 1.5rem;
  max-width: 42rem;
}

.alert {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1rem;
  border-radius: var(--radius-lg);
  margin-bottom: 1.5rem;
  font-size: 0.875rem;
}

.alert-success {
  background: rgba(34, 197, 94, 0.15);
  color: var(--success);
}

.alert-error {
  background: rgba(186, 26, 26, 0.15);
  color: var(--error);
}

.alert .material-symbols-outlined {
  font-size: 1.25rem;
}

.settings-form {
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
}

.form-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
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

.input {
  width: 100%;
  padding: 0.75rem 1rem;
  background: var(--surface-container-lowest);
  border: 1px solid var(--outline-variant);
  border-radius: var(--radius);
  font-size: 0.875rem;
  color: var(--on-surface);
  transition: border-color var(--transition-base);
  box-sizing: border-box;
}

.input:focus {
  outline: none;
  border-color: var(--primary);
}

.input::placeholder {
  color: var(--outline);
}

.form-actions {
  display: flex;
  justify-content: flex-end;
  padding-top: 0.5rem;
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

.btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.btn .material-symbols-outlined {
  font-size: 1rem;
}

.btn-primary {
  background: linear-gradient(135deg, var(--primary) 0%, var(--primary-container) 100%);
  color: white;
}

.btn-primary:hover:not(:disabled) {
  transform: scale(1.01);
}
</style>
