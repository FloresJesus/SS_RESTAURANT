import { defineStore } from "pinia"

interface User {
  id: number
  nombre: string
  apellido: string
  email: string
  rol: string
  activo: boolean
}

interface LoginResponse {
  token: string
  user: User
}

interface LoginResult {
  success: boolean
  error?: string
}

export const useAuthStore = defineStore("auth", {

  state: () => ({
    user: null as User | null,
    token: null as string | null
  }),

  getters: {
    isAuthenticated: (state) => state.token !== null && state.token !== ""
  },

  actions: {

    init() {
      try {
        const rawToken = localStorage.getItem("token")
        const rawUser = localStorage.getItem("user")

        if (rawToken && rawToken.length > 0) {
          this.token = rawToken
        }

        if (rawUser && rawUser.length > 0) {
          this.user = JSON.parse(rawUser)
        }
      } catch {
        this.token = null
        this.user = null
        localStorage.removeItem("token")
        localStorage.removeItem("user")
      }
    },

    async login(email: string, password: string): Promise<LoginResult> {

      try {

        const response = await fetch("http://localhost:3000/api/auth/login", {

          method: "POST",

          headers: {
            "Content-Type": "application/json"
          },

          body: JSON.stringify({
            email,
            password
          })

        })

        const data: LoginResponse = await response.json()

        if (!response.ok) {

          return {
            success: false,
            error: "Credenciales incorrectas"
          }

        }

        this.token = data.token
        this.user = data.user

        localStorage.setItem("token", data.token)
        localStorage.setItem("user", JSON.stringify(data.user))

        return { success: true }

      } catch (error) {

        return {
          success: false,
          error: "Error de conexión con el servidor"
        }

      }

    },

    logout() {

      this.user = null
      this.token = null

      localStorage.removeItem("token")
      localStorage.removeItem("user")

    }

  }

})
