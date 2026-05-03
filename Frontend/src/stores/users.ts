import { defineStore } from "pinia"
import { apiFetch } from "@/utils/api"

interface User {
  id: number
  firstName: string
  lastName: string
  email: string
  rol: string
  active: boolean
}

export const useUsersStore = defineStore("users", {
  state: () => ({
    users: [] as User[],
  }),
  actions: {
    async fetchUsers() {
      try {
        const data = await apiFetch("http://localhost:3000/api/users")
        this.users = data.map((user: any) => ({
          id: user.id,
          firstName: user.nombre,
          lastName: user.apellido,
          email: user.correo,
          rol: user.rol,
          active: Boolean(user.activo),
        }))
      } catch (error) {
        console.error("Error fetching users:", error)
      }
    },
  },
})
