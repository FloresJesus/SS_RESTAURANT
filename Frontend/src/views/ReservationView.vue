<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'

const router = useRouter()

const API_BASE = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:3000/api'

const form = ref({
  nombre: '',
  telefono: '',
  correo: '',
  fecha: '',
  hora: '',
  personas: 1,
  notas: ''
})

const submitting = ref(false)
const success = ref(false)
const error = ref('')
const assignedTable = ref('')

const today = new Date().toISOString().split('T')[0]
const openHours = ['12:00', '12:30', '13:00', '13:30', '14:00', '14:30', '19:00', '19:30', '20:00', '20:30', '21:00', '21:30']

const submitReservation = async () => {
  submitting.value = true
  error.value = ''
  success.value = false

  try {
    const response = await fetch(`${API_BASE}/public/reservations`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        nombre: form.value.nombre.trim(),
        telefono: form.value.telefono.trim(),
        correo: form.value.correo.trim() || null,
        fecha: form.value.fecha,
        hora: form.value.hora,
        personas: Number(form.value.personas),
        notas: form.value.notas.trim() || null
      })
    })

    const data = await response.json()

    if (!response.ok) {
      error.value = data.message || 'Error al crear la reservacion'
      return
    }

    success.value = true
    assignedTable.value = data.mesa || ''
    form.value = { nombre: '', telefono: '', correo: '', fecha: '', hora: '', personas: 1, notas: '' }
  } catch {
    error.value = 'Error de conexion con el servidor'
  } finally {
    submitting.value = false
  }
}
</script>

<template>
  <div class="reservation-page">
    <div class="reservation-container">
      <!-- Header -->
      <div class="reservation-header">
        <div class="logo-badge">
          <span class="material-symbols-outlined">restaurant</span>
        </div>
        <h1 class="reservation-title">Restaurante San Salvador</h1>
        <p class="reservation-subtitle">Reserva tu mesa en linea</p>
      </div>

      <!-- Success State -->
      <div v-if="success" class="success-card">
        <span class="material-symbols-outlined success-icon">check_circle</span>
        <h2 class="success-title">Reservacion Confirmada</h2>
        <p class="success-text">
          Tu reservacion ha sido registrada exitosamente.
          <span v-if="assignedTable">Mesa asignada: <strong>{{ assignedTable }}</strong></span>
        </p>
        <p class="success-detail">Te contactaremos para confirmar los detalles.</p>
        <button @click="success = false" class="btn btn-primary">
          Hacer otra reservacion
        </button>
      </div>

      <!-- Reservation Form -->
      <form v-else @submit.prevent="submitReservation" class="reservation-form">
        <div class="form-section">
          <h3 class="section-title">Datos de Contacto</h3>
          <div class="form-row">
            <div class="form-group">
              <label class="form-label">Nombre completo *</label>
              <input v-model="form.nombre" type="text" class="input" placeholder="Tu nombre" required />
            </div>
            <div class="form-group">
              <label class="form-label">Telefono *</label>
              <input v-model="form.telefono" type="tel" class="input" placeholder="Tu telefono" required />
            </div>
          </div>
          <div class="form-group">
            <label class="form-label">Correo electronico</label>
            <input v-model="form.correo" type="email" class="input" placeholder="correo@ejemplo.com" />
          </div>
        </div>

        <div class="form-section">
          <h3 class="section-title">Detalles de la Reservacion</h3>
          <div class="form-row">
            <div class="form-group">
              <label class="form-label">Fecha *</label>
              <input v-model="form.fecha" type="date" class="input" :min="today" required />
            </div>
            <div class="form-group">
              <label class="form-label">Hora *</label>
              <select v-model="form.hora" class="input" required>
                <option value="" disabled>Selecciona un horario</option>
                <option v-for="hour in openHours" :key="hour" :value="hour">{{ hour }}</option>
              </select>
            </div>
          </div>
          <div class="form-group">
            <label class="form-label">Numero de personas *</label>
            <input v-model.number="form.personas" type="number" class="input" min="1" max="20" required />
          </div>
          <div class="form-group">
            <label class="form-label">Notas adicionales</label>
            <textarea v-model="form.notas" class="input textarea" placeholder="Alergias, celebraciones, preferencias..."></textarea>
          </div>
        </div>

        <div v-if="error" class="error-message">
          <span class="material-symbols-outlined">error</span>
          {{ error }}
        </div>

        <button type="submit" :disabled="submitting" class="btn btn-primary btn-lg">
          <span v-if="submitting" class="material-symbols-outlined spinning">progress_activity</span>
          {{ submitting ? 'Procesando...' : 'Confirmar Reservacion' }}
        </button>

        <router-link to="/login" class="back-link">
          <span class="material-symbols-outlined">login</span>
          Acceder al sistema
        </router-link>
      </form>
    </div>
  </div>
</template>

<style scoped>
.reservation-page {
  min-height: 100vh;
  background: linear-gradient(135deg, #f0f4f3 0%, #e8ede9 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 2rem 1rem;
}

.reservation-container {
  width: 100%;
  max-width: 480px;
}

.reservation-header {
  text-align: center;
  margin-bottom: 2rem;
}

.logo-badge {
  width: 4rem;
  height: 4rem;
  background: linear-gradient(135deg, #00342b 0%, #004d3f 100%);
  border-radius: 1rem;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto 1rem;
}

.logo-badge .material-symbols-outlined {
  color: white;
  font-size: 2rem;
}

.reservation-title {
  font-size: 1.5rem;
  font-weight: 700;
  color: #00342b;
  margin: 0 0 0.25rem;
}

.reservation-subtitle {
  font-size: 0.875rem;
  color: #6b7280;
  margin: 0;
}

.reservation-form {
  background: white;
  border-radius: 1rem;
  padding: 1.5rem;
  box-shadow: 0 4px 24px rgba(0, 0, 0, 0.08);
}

.form-section {
  margin-bottom: 1.5rem;
}

.section-title {
  font-size: 0.875rem;
  font-weight: 600;
  color: #00342b;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  margin: 0 0 1rem;
  padding-bottom: 0.5rem;
  border-bottom: 2px solid #e8ede9;
}

.form-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;
}

.form-group {
  margin-bottom: 1rem;
}

.form-label {
  display: block;
  font-size: 0.8125rem;
  font-weight: 500;
  color: #374151;
  margin-bottom: 0.375rem;
}

.input {
  width: 100%;
  padding: 0.625rem 0.75rem;
  border: 1px solid #d1d5db;
  border-radius: 0.5rem;
  font-size: 0.875rem;
  color: #111827;
  background: #f9fafb;
  transition: all 0.2s;
}

.input:focus {
  outline: none;
  border-color: #00342b;
  box-shadow: 0 0 0 3px rgba(0, 52, 43, 0.1);
  background: white;
}

.textarea {
  min-height: 80px;
  resize: vertical;
}

.error-message {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1rem;
  background: #fef2f2;
  border: 1px solid #fecaca;
  border-radius: 0.5rem;
  color: #991b1b;
  font-size: 0.875rem;
  margin-bottom: 1rem;
}

.btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  border: none;
  border-radius: 0.5rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-primary {
  background: #00342b;
  color: white;
}

.btn-primary:hover:not(:disabled) {
  background: #004d3f;
}

.btn-primary:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.btn-lg {
  width: 100%;
  padding: 0.75rem 1.5rem;
  font-size: 1rem;
}

.back-link {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.375rem;
  margin-top: 1rem;
  color: #6b7280;
  text-decoration: none;
  font-size: 0.875rem;
  transition: color 0.2s;
}

.back-link:hover {
  color: #00342b;
}

.back-link .material-symbols-outlined {
  font-size: 1.125rem;
}

.success-card {
  background: white;
  border-radius: 1rem;
  padding: 2rem 1.5rem;
  text-align: center;
  box-shadow: 0 4px 24px rgba(0, 0, 0, 0.08);
}

.success-icon {
  font-size: 3rem;
  color: #059669;
  margin-bottom: 1rem;
}

.success-title {
  font-size: 1.25rem;
  font-weight: 700;
  color: #00342b;
  margin: 0 0 0.5rem;
}

.success-text {
  font-size: 0.875rem;
  color: #374151;
  margin: 0 0 0.5rem;
  line-height: 1.5;
}

.success-detail {
  font-size: 0.8125rem;
  color: #6b7280;
  margin: 0 0 1.5rem;
}

.spinning {
  animation: spin 1s linear infinite;
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

@media (max-width: 480px) {
  .form-row {
    grid-template-columns: 1fr;
  }
}
</style>
