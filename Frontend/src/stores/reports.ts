import { defineStore } from 'pinia'
import { apiFetch } from '@/utils/api'

export interface ReportEntry {
  id: number
  usuario_id: number
  usuario_nombre: string
  usuario_email: string
  tipo: string
  parametros: Record<string, any> | null
  fecha_inicio: string
  fecha_fin: string
  total_generado: number | null
  archivo_pdf: string
  creado_en: string
}

export interface ReportTipo {
  value: string
  label: string
}

export const useReportsStore = defineStore('reports', {
  state: () => ({
    reports: [] as ReportEntry[],
    tipos: [] as ReportTipo[],
    loading: false,
    generating: false,
    error: '' as string
  }),

  actions: {
    async fetchReports(tipo?: string) {
      this.loading = true
      this.error = ''
      try {
        let url = '/api/reports'
        if (tipo) url += `?tipo=${tipo}`
        const data = await apiFetch(url)
        this.reports = data as ReportEntry[]
      } catch (err: any) {
        this.error = err.message || 'Error al cargar reportes'
        this.reports = []
      } finally {
        this.loading = false
      }
    },

    async fetchTipos() {
      try {
        const data = await apiFetch('/api/reports/tipos')
        this.tipos = data as ReportTipo[]
      } catch {
        this.tipos = []
      }
    },

    async generateReport(tipo: string, params: Record<string, any>) {
      this.generating = true
      this.error = ''
      try {
        const data = await apiFetch(`/api/reports/generate/${tipo}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(params)
        })
        return data as { id: number; archivo_pdf: string; total_generado: number; message: string }
      } catch (err: any) {
        this.error = err.message || 'Error al generar reporte'
        throw err
      } finally {
        this.generating = false
      }
    },

    async deleteReport(id: number) {
      await apiFetch(`/api/reports/${id}`, { method: 'DELETE' })
      this.reports = this.reports.filter(r => r.id !== id)
    }
  }
})
