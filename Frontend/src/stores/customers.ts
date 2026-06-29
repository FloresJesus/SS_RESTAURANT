import { defineStore } from "pinia"
import { apiFetch, API_BASE } from "@/utils/api"

interface Customer {
  id: number
  nombre: string
  telefono: string
  correo: string | null
  notas: string | null
  creado_en: string
}

export const useCustomersStore = defineStore("customers", {
  state: () => ({
    customers: [] as Customer[],
  }),
  actions: {
    async fetchCustomers() {
      try {
        const data = await apiFetch(`${API_BASE}/customers`)
        this.customers = data
      } catch (error) {
        console.error("Error fetching customers:", error)
      }
    },
  },
})
