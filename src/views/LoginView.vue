<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

const router = useRouter()
const authStore = useAuthStore()

const email = ref('')
const password = ref('')
const error = ref('')
const isLoading = ref(false)
const rememberMe = ref(false)

const handleSubmit = async () => {
  error.value = ''
  isLoading.value = true
  
  try {
    const result = await authStore.login(email.value, password.value)
    
    if (result.success) {
      router.push('/')
    } else {
      error.value = result.error
    }
  } catch (e) {
    error.value = 'Error al iniciar sesion. Intenta de nuevo.'
  } finally {
    isLoading.value = false
  }
}
</script>

<template>
  <div class="login-page">
    <div class="background-layer">
      <img 
        src="https://lh3.googleusercontent.com/aida-public/AB6AXuDuzqjIBniAPrwVLxLHihqgRvYb_5TQFV-stCV2vBo_Fth_L47eaucYAru-fEfwDrH40lymK9UuokPWhi0qn2K4ozR-B9WQXcjA91lWFGzgIns9vf-_2W_wJorYD18r4X8E-RjBbfm9NExKgDVA_KsjcqLdljzFC0A5RnXkfyS8EkcBJS5SZYqWvh83zSShpqSDCDmtRnxhvMKWjmDmY3pLjEGLO7E7gvQi5kAFclprooaK5rJGGR-Qp_JZjh8qEVZ9JlAjS1eZHDSm" 
        alt="Luxury restaurant interior"
        class="background-image"
      />
      <div class="background-overlay"></div>
    </div>

    <main class="login-canvas">
      <!-- Login Card -->
      <div class="login-card animate-fade-in">
        <!-- Branding -->
        <header class="branding">
          <p class="brand-subtitle">Restaurante</p>
          <h1 class="brand-title">SAN SALVADOR</h1>
        </header>

        <div v-if="error" class="error-message">
          <span class="material-symbols-outlined">error</span>
          <span>{{ error }}</span>
        </div>

        <form @submit.prevent="handleSubmit" class="login-form">
          <!-- Email Field -->
          <div class="form-field">
            <label class="form-label" for="email">Email</label>
            <div class="input-wrapper">
              <input
                id="email"
                v-model="email"
                type="email"
                class="form-input"
                placeholder="chef@sansalvador.com"
                required
              />
              <span class="material-symbols-outlined input-icon">mail</span>
            </div>
          </div>

          <div class="form-field">
            <label class="form-label" for="password">Security Cipher</label>
            <div class="input-wrapper">
              <input
                id="password"
                v-model="password"
                type="password"
                class="form-input"
                placeholder="••••••••"
                required
              />
              <span class="material-symbols-outlined input-icon">lock</span>
            </div>
          </div>

          <div class="form-options">
            <label class="checkbox-label">
              <input v-model="rememberMe" type="checkbox" class="checkbox" />
              <span>Mantente conectado</span>
            </label>
            <a href="#" class="forgot-link">¿Olvidaste tu contraseña?</a>
          </div>

          <button type="submit" class="submit-btn" :disabled="isLoading">
            <span v-if="isLoading" class="loading-spinner"></span>
            <span v-else>Iniciar Sesion</span>
          </button>
        </form>
      </div>

      
    </main>

    <div class="decorative-edge"></div>
  </div>
</template>

<style scoped>
.login-page {
  min-height: 100vh;
  overflow: hidden;
  position: relative;
}

/* Background */
.background-layer {
  position: fixed;
  inset: 0;
  z-index: 0;
}

.background-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
  filter: blur(8px);
  transform: scale(1.05);
  opacity: 0.75;
}

.background-overlay {
  position: absolute;
  inset: 0;
  background-color: rgba(0, 52, 43, 0.2);
  mix-blend-mode: multiply;
}

/* Login Canvas */
.login-canvas {
  position: relative;
  z-index: 10;
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 1.5rem;
}

@media (min-width: 640px) {
  .login-canvas {
    padding: 3rem;
  }
}

/* Login Card */
.login-card {
  width: 100%;
  max-width: 28rem;
  background: rgba(255, 255, 255, 0.85);
  backdrop-filter: blur(16px);
  -webkit-backdrop-filter: blur(16px);
  border-radius: var(--radius-xl);
  box-shadow: var(--shadow-2xl);
  padding: 2.5rem;
  display: flex;
  flex-direction: column;
  gap: 2rem;
  border: 1px solid rgba(255, 255, 255, 0.2);
}

/* Branding */
.branding {
  text-align: center;
}

.brand-title {
  font-family: var(--font-headline);
  font-style: italic;
  font-size: 2.25rem;
  letter-spacing: -0.05em;
  color: var(--primary);
  margin-bottom: 0.5rem;
}

.brand-subtitle {
  font-family: var(--font-label);
  font-size: 0.625rem;
  font-weight: 700;
  letter-spacing: 0.2em;
  text-transform: uppercase;
  color: var(--on-surface-variant);
}

/* Error Message */
.error-message {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1rem;
  background: rgba(186, 26, 26, 0.1);
  border: 1px solid rgba(186, 26, 26, 0.2);
  border-radius: var(--radius-lg);
  color: var(--error);
  font-size: 0.875rem;
}

.error-message .material-symbols-outlined {
  font-size: 1.25rem;
}

/* Form */
.login-form {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.form-field {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.form-label {
  font-family: var(--font-label);
  font-size: 0.625rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.15em;
  color: var(--on-surface-variant);
  margin-left: 0.25rem;
}

.input-wrapper {
  position: relative;
}

.form-input {
  width: 100%;
  background: var(--surface-container-lowest);
  border: 1px solid rgba(191, 201, 196, 0.2);
  padding: 0.875rem 1rem;
  padding-right: 2.75rem;
  font-family: var(--font-body);
  font-size: 0.875rem;
  color: var(--on-surface);
  transition: all var(--transition-base);
}

.form-input::placeholder {
  color: var(--outline);
  opacity: 0.4;
}

.form-input:focus {
  outline: none;
  border-bottom: 2px solid var(--primary);
}

.input-icon {
  position: absolute;
  right: 1rem;
  top: 50%;
  transform: translateY(-50%);
  color: var(--outline);
  opacity: 0.4;
  font-size: 1.125rem;
}

/* Form Options */
.form-options {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.checkbox-label {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  cursor: pointer;
  font-size: 0.75rem;
  color: var(--on-surface-variant);
  font-weight: 500;
  transition: color var(--transition-base);
}

.checkbox-label:hover {
  color: var(--primary);
}

.checkbox {
  width: 1rem;
  height: 1rem;
  border-radius: 0.125rem;
  border: 1px solid var(--outline-variant);
  accent-color: var(--primary);
}

.forgot-link {
  font-size: 0.75rem;
  font-weight: 600;
  color: var(--primary);
  text-decoration: underline;
  text-decoration-color: rgba(0, 52, 43, 0.2);
  text-underline-offset: 4px;
  transition: all var(--transition-base);
}

.forgot-link:hover {
  color: var(--primary-container);
}

/* Submit Button */
.submit-btn {
  width: 100%;
  background: linear-gradient(135deg, var(--primary) 0%, var(--primary-container) 100%);
  color: white;
  padding: 1rem;
  border: none;
  border-radius: var(--radius-lg);
  font-family: var(--font-label);
  font-size: 0.75rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.15em;
  cursor: pointer;
  box-shadow: 0 4px 14px rgba(0, 52, 43, 0.2);
  transition: all var(--transition-base);
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
}

.submit-btn:hover:not(:disabled) {
  transform: scale(1.01);
  box-shadow: 0 6px 20px rgba(0, 52, 43, 0.3);
}

.submit-btn:active:not(:disabled) {
  transform: scale(0.98);
}

.submit-btn:disabled {
  opacity: 0.7;
  cursor: not-allowed;
}

.loading-spinner {
  width: 1.25rem;
  height: 1.25rem;
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-top-color: white;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

/* Security Footer */
.security-footer {
  padding-top: 1.5rem;
  border-top: 1px solid rgba(191, 201, 196, 0.1);
}

.security-badges {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 1.5rem;
}

.security-badge {
  display: flex;
  align-items: center;
  gap: 0.25rem;
  opacity: 0.4;
  filter: grayscale(1);
  transition: all var(--transition-base);
  cursor: default;
}

.security-badge:hover {
  filter: grayscale(0);
  opacity: 1;
}

.security-badge .material-symbols-outlined {
  font-size: 1.125rem;
}

.security-badge span:last-child {
  font-size: 0.625rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: -0.02em;
}

/* Test Credentials */
.test-credentials {
  background: var(--surface-container);
  border-radius: var(--radius-lg);
  padding: 1rem;
  border: 1px solid var(--outline-variant);
}

.credentials-title {
  font-size: 0.75rem;
  color: var(--on-surface-variant);
  margin-bottom: 0.75rem;
}

.credentials-list {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.credential-item {
  display: flex;
  justify-content: space-between;
  font-size: 0.75rem;
}

.credential-role {
  color: var(--on-surface-variant);
}

.credential-value {
  color: var(--on-surface);
  font-family: monospace;
}

/* Global Footer */
.global-footer {
  margin-top: 2rem;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1rem;
}

.support-link {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  color: rgba(255, 255, 255, 0.7);
  text-decoration: none;
  transition: color var(--transition-base);
}

.support-link:hover {
  color: white;
}

.support-link .material-symbols-outlined {
  font-size: 0.875rem;
}

.support-link span:last-child {
  font-size: 0.6875rem;
  font-weight: 500;
  letter-spacing: 0.025em;
  border-bottom: 1px solid rgba(255, 255, 255, 0.2);
  transition: border-color var(--transition-base);
}

.support-link:hover span:last-child {
  border-color: white;
}

.copyright {
  font-size: 0.625rem;
  color: rgba(255, 255, 255, 0.4);
  font-weight: 500;
  letter-spacing: 0.1em;
  text-transform: uppercase;
}

/* Decorative Edge */
.decorative-edge {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 0.25rem;
  background: linear-gradient(90deg, transparent, rgba(148, 211, 193, 0.3), transparent);
  z-index: 20;
}
</style>
