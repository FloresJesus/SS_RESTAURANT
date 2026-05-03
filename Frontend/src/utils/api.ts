const API_BASE = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:3000/api'

const buildHeaders = (extra?: Record<string, string>): Record<string, string> => {
  const headers: Record<string, string> = { ...(extra || {}) }
  const token = localStorage.getItem('token')
  if (token) {
    headers['Authorization'] = `Bearer ${token}`
  }
  return headers
}

export const apiFetch = async (url: string, options: RequestInit = {}) => {
  const token = localStorage.getItem('token')
  const baseHeaders: Record<string, string> = {}
  if (options.headers instanceof Headers) {
    options.headers.forEach((v, k) => { baseHeaders[k] = v })
  } else if (options.headers && typeof options.headers === 'object') {
    Object.assign(baseHeaders, options.headers)
  }
  if (token) {
    baseHeaders['Authorization'] = `Bearer ${token}`
  }
  const response = await fetch(url, { ...options, headers: baseHeaders })
  if (!response.ok) {
    const error = await response.text()
    if (response.status === 401) {
      localStorage.removeItem('token')
      localStorage.removeItem('user')
      window.location.href = '/login'
    }
    throw new Error(error || response.statusText)
  }
  return response.json()
}

export { API_BASE }
