export interface ValidationRule {
  validate: (value: string | number | boolean) => boolean
  message: string
}

export const required = (message = 'Este campo es obligatorio'): ValidationRule => ({
  validate: (v) => v !== '' && v !== null && v !== undefined,
  message
})

export const minLength = (min: number, message?: string): ValidationRule => ({
  validate: (v) => typeof v === 'string' ? v.length >= min : true,
  message: message || `Minimo ${min} caracteres`
})

export const maxLength = (max: number, message?: string): ValidationRule => ({
  validate: (v) => typeof v === 'string' ? v.length <= max : true,
  message: message || `Maximo ${max} caracteres`
})

export const isEmail = (message = 'Ingrese un email valido'): ValidationRule => ({
  validate: (v) => {
    if (!v || v === '') return true
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(v))
  },
  message
})

export const noNumbers = (message = 'No se permiten numeros'): ValidationRule => ({
  validate: (v) => typeof v === 'string' ? !/[0-9]/.test(v) : true,
  message
})

export const noSpecialChars = (message = 'No se permiten caracteres especiales'): ValidationRule => ({
  validate: (v) => typeof v === 'string' ? /^[a-zA-ZáéíóúÁÉÍÓÚñÑüÜ\s]*$/.test(v) : true,
  message
})

export const onlyLetters = (message = 'Solo se permiten letras'): ValidationRule => ({
  validate: (v) => typeof v === 'string' ? /^[a-zA-ZáéíóúÁÉÍÓÚñÑüÜ\s]+$/.test(v) : true,
  message
})

export const isPhone = (message = 'Ingrese un telefono valido (ej: +591 69999999)'): ValidationRule => ({
  validate: (v) => {
    if (!v || v === '') return true
    return /^[\d\s+\-()]{7,20}$/.test(String(v))
  },
  message
})

export const isNumeric = (message = 'Solo se permiten numeros'): ValidationRule => ({
  validate: (v) => {
    if (v === '' || v === null || v === undefined) return true
    return !isNaN(Number(v)) && Number(v) >= 0
  },
  message
})

export const min = (minVal: number, message?: string): ValidationRule => ({
  validate: (v) => Number(v) >= minVal,
  message: message || `El valor minimo es ${minVal}`
})

export const max = (maxVal: number, message?: string): ValidationRule => ({
  validate: (v) => Number(v) <= maxVal,
  message: message || `El valor maximo es ${maxVal}`
})

export const isUrl = (message = 'Ingrese una URL valida'): ValidationRule => ({
  validate: (v) => {
    if (!v || v === '') return true
    try { new URL(String(v)); return true }
    catch { return false }
  },
  message
})

export const matchRegex = (regex: RegExp, message: string): ValidationRule => ({
  validate: (v) => regex.test(String(v)),
  message
})

export const composeValidators = (...rules: ValidationRule[]) => ({
  validate: (value: string | number | boolean) => {
    for (const rule of rules) {
      if (!rule.validate(value)) return false
    }
    return true
  },
  getFirstError: (value: string | number | boolean) => {
    for (const rule of rules) {
      if (!rule.validate(value)) return rule.message
    }
    return ''
  }
})
