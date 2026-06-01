<template>
  <div class="form-field" :class="{ 'form-field--error': !!error, 'form-field--success': !error && hasValue && touched }">
    <label v-if="label" class="form-field__label" :for="inputId">
      {{ label }}
      <span v-if="required" class="form-field__required">*</span>
    </label>

    <div class="form-field__input-wrapper">
      <!-- Textarea -->
      <textarea
        v-if="type === 'textarea'"
        :id="inputId"
        :value="String(modelValue ?? '')"
        @input="onInput"
        @blur="onBlur"
        v-bind="$attrs"
        :placeholder="placeholder"
        :class="['form-field__input', 'form-field__textarea', inputClass]"
      ></textarea>

      <!-- Select -->
      <select
        v-else-if="type === 'select'"
        :id="inputId"
        :value="String(modelValue ?? '')"
        @change="onInput"
        @blur="onBlur"
        v-bind="$attrs"
        :class="['form-field__input', 'form-field__select', inputClass]"
      >
        <option v-if="placeholder" value="" disabled>{{ placeholder }}</option>
        <slot name="options" />
      </select>

      <!-- Default input -->
      <input
        v-else
        :id="inputId"
        :type="type === 'checkbox' ? 'checkbox' : type || 'text'"
        :value="type === 'number' ? modelValue : String(modelValue ?? '')"
        :checked="type === 'checkbox' ? !!modelValue : undefined"
        @input="onInput"
        @blur="onBlur"
        v-bind="$attrs"
        :placeholder="placeholder"
        :class="['form-field__input', inputClass]"
      />

      <!-- Success icon -->
      <span v-if="!error && hasValue && touched" class="form-field__icon form-field__icon--success">
        <span class="material-symbols-outlined">check_circle</span>
      </span>
    </div>

    <!-- Error message -->
    <transition name="slide-fade">
      <p v-if="error" class="form-field__error">
        <span class="material-symbols-outlined">error</span>
        {{ error }}
      </p>
    </transition>

    <!-- Character count -->
    <p v-if="maxlength && type === 'textarea'" class="form-field__counter">
      {{ String(modelValue || '').length }}/{{ maxlength }}
    </p>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'

const props = defineProps<{
  modelValue?: string | number | boolean
  label?: string
  type?: string
  placeholder?: string
  required?: boolean
  error?: string
  inputClass?: string
  inputId?: string
  maxlength?: number
}>()

const emit = defineEmits<{
  'update:modelValue': [value: string | number | boolean]
  'blur': [value: FocusEvent]
}>()

const hasValue = computed(() => {
  const v = props.modelValue
  return v !== '' && v !== null && v !== undefined && v !== false
})

const touched = computed(() => {
  return !!props.error || hasValue.value
})

const onInput = (event: Event) => {
  const target = event.target as HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
  const value = target.type === 'checkbox' ? (target as HTMLInputElement).checked : target.value
  emit('update:modelValue', value)
}

const onBlur = (event: FocusEvent) => {
  emit('blur', event)
}
</script>

<style scoped>
.form-field {
  display: flex;
  flex-direction: column;
  gap: 0.375rem;
  position: relative;
}

.form-field__label {
  font-size: 0.75rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: var(--on-surface-variant);
  transition: color var(--transition-base);
}

.form-field--error .form-field__label {
  color: var(--error);
}

.form-field__required {
  color: var(--error);
  margin-left: 0.125rem;
}

.form-field__input-wrapper {
  position: relative;
  display: flex;
  align-items: center;
}

.form-field__input {
  width: 100%;
  padding: 0.75rem 1rem;
  background: var(--surface-container-lowest);
  border: 1.5px solid var(--outline-variant);
  border-radius: var(--radius-lg);
  font-family: var(--font-body);
  font-size: 0.875rem;
  color: var(--on-surface);
  transition: all var(--transition-base);
  outline: none;
  box-sizing: border-box;
}

.form-field__input::placeholder {
  color: var(--outline);
  font-size: 0.8125rem;
}

.form-field__input:focus {
  border-color: var(--primary);
  box-shadow: 0 0 0 3px rgba(0, 52, 43, 0.08);
  background: var(--surface);
}

.form-field--error .form-field__input {
  border-color: var(--error);
  box-shadow: 0 0 0 3px rgba(186, 26, 26, 0.08);
  background: var(--surface);
}

.form-field--error .form-field__input:focus {
  border-color: var(--error);
  box-shadow: 0 0 0 3px rgba(186, 26, 26, 0.12);
}

.form-field--success .form-field__input:not(:focus) {
  border-color: var(--success);
}

.form-field__textarea {
  min-height: 100px;
  resize: vertical;
  line-height: 1.5;
}

.form-field__select {
  appearance: none;
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='%236b7280' d='M6 8L1 3h10z'/%3E%3C/svg%3E");
  background-repeat: no-repeat;
  background-position: right 0.75rem center;
  padding-right: 2.25rem;
  cursor: pointer;
}

.form-field__icon {
  position: absolute;
  right: 0.75rem;
  display: flex;
  align-items: center;
  pointer-events: none;
}

.form-field__icon--success .material-symbols-outlined {
  font-size: 1.25rem;
  color: var(--success);
}

.form-field__error {
  display: flex;
  align-items: center;
  gap: 0.25rem;
  margin: 0;
  font-size: 0.75rem;
  color: var(--error);
  line-height: 1.3;
}

.form-field__error .material-symbols-outlined {
  font-size: 0.875rem;
  flex-shrink: 0;
}

.form-field__counter {
  margin: 0;
  font-size: 0.6875rem;
  color: var(--on-surface-variant);
  text-align: right;
}

/* Transitions */
.slide-fade-enter-active {
  transition: all 0.2s ease-out;
}

.slide-fade-leave-active {
  transition: all 0.15s ease-in;
}

.slide-fade-enter-from {
  opacity: 0;
  transform: translateY(-4px);
}

.slide-fade-leave-to {
  opacity: 0;
  transform: translateY(-4px);
}
</style>
