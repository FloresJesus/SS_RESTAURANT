import { ref, computed, type Ref } from 'vue'
import { type ValidationRule } from '@/utils/validators'

export interface FieldRule {
  rules: ValidationRule[]
  value: Ref<string | number | boolean>
}

export function useFormValidation(fields: Record<string, FieldRule>) {
  const errors = ref<Record<string, string>>({})
  const touched = ref<Record<string, boolean>>({})
  const submitted = ref(false)

  const validateField = (fieldName: string) => {
    const field = fields[fieldName]
    if (!field) return true

    for (const rule of field.rules) {
      if (!rule.validate(field.value.value)) {
        errors.value[fieldName] = rule.message
        return false
      }
    }

    const newErrors = { ...errors.value }
    delete newErrors[fieldName]
    errors.value = newErrors
    return true
  }

  const touchField = (fieldName: string) => {
    touched.value[fieldName] = true
    validateField(fieldName)
  }

  const validateAll = () => {
    submitted.value = true
    let isValid = true

    for (const fieldName of Object.keys(fields)) {
      touched.value[fieldName] = true
      if (!validateField(fieldName)) {
        isValid = false
      }
    }

    return isValid
  }

  const getError = (fieldName: string) => {
    if (touched.value[fieldName] || submitted.value) {
      return errors.value[fieldName] || ''
    }
    return ''
  }

  const hasError = (fieldName: string) => {
    return !!getError(fieldName)
  }

  const isValid = computed(() => {
    for (const fieldName of Object.keys(fields)) {
      if (errors.value[fieldName]) return false
    }
    return Object.keys(fields).length > 0
  })

  const resetValidation = () => {
    errors.value = {}
    touched.value = {}
    submitted.value = false
  }

  return {
    errors,
    touched,
    submitted,
    validateField,
    touchField,
    validateAll,
    getError,
    hasError,
    isValid,
    resetValidation
  }
}
