import { defineStore } from 'pinia'
import { apiFetch } from '@/utils/api'

export interface AuditEntry {
  id: number
  usuario_id: number
  usuario_nombre: string
  usuario_email: string
  accion: string
  tabla: string
  registro_id: number | null
  detalle: string | null
  direccion_ip: string | null
  creado_en: string
}

interface AuditFilters {
  accion?: string
  tabla?: string
  usuario_id?: number
  desde?: string
  hasta?: string
}

export const useAuditStore = defineStore('audit', {
  state: () => ({
    entries: [] as AuditEntry[],
    loading: false,
    error: '' as string
  }),

  getters: {
    uniqueAcciones: (state) => {
      const acciones = new Set(state.entries.map(e => e.accion))
      return Array.from(acciones).sort()
    },
    uniqueTablas: (state) => {
      const tablas = new Set(state.entries.map(e => e.tabla))
      return Array.from(tablas).sort()
    }
  },

  actions: {
    async fetchAudit(filters?: AuditFilters) {
      this.loading = true
      this.error = ''

      try {
        let url = '/api/audit'
        if (filters) {
          const params = new URLSearchParams()
          if (filters.accion) params.append('accion', filters.accion)
          if (filters.tabla) params.append('tabla', filters.tabla)
          if (filters.usuario_id) params.append('usuario_id', String(filters.usuario_id))
          if (filters.desde) params.append('desde', filters.desde)
          if (filters.hasta) params.append('hasta', filters.hasta)
          const queryStr = params.toString()
          if (queryStr) url += `?${queryStr}`
        }

        const data = await apiFetch(url)
        this.entries = data as AuditEntry[]
      } catch (err: any) {
        this.error = err.message || 'Error al cargar auditoria'
        this.entries = []
      } finally {
        this.loading = false
      }
    }
  }
})
