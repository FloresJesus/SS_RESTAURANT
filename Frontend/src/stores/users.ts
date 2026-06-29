import { defineStore } from "pinia"
import { apiFetch, API_BASE } from "@/utils/api"

type UserRole = 'admin' | 'cajero' | 'mesero' | 'cocina'

interface User {
  id: number
  nombre: string
  apellido: string
  email: string
  rol: UserRole
  activo: boolean
  creado_en: string
}

export const useUsersStore = defineStore("users", {
  state: () => ({
    users: [] as User[],
  }),
  actions: {
    async fetchUsers() {
      try {
        const data = await apiFetch(`${API_BASE}/users`)
        this.users = data.map((user: any) => ({
          id: user.id,
          nombre: user.nombre,
          apellido: user.apellido,
          email: user.email,
          rol: user.rol,
          activo: Boolean(user.activo),
          creado_en: user.creado_en
        }))
      } catch (error) {
        console.error("Error fetching users:", error)
      }
    },
    async createUser(user: any) {
      return apiFetch(`${API_BASE}/users`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(user)
      })
    },
    async updateUser(id: number, user: any) {
      return apiFetch(`${API_BASE}/users/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(user)
      })
    },
    async deleteUser(id: number) {
      return apiFetch(`${API_BASE}/users/${id}`, {
        method: "DELETE"
      })
    }
  },
})
