import { defineStore } from "pinia"
import { API_BASE } from "@/utils/api"

interface User {
  id: number
  nombre: string
  apellido: string
  email: string
  rol: 'admin' | 'cajero' | 'mesero' | 'cocina'
  activo: boolean
}

interface LoginResponse {
  token: string
  user: User
}

interface ErrorResponse {
  message: string
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
    isAuthenticated: (state) => state.token !== null && state.token !== "",
    isAdmin: (state) => state.user?.rol === "admin",
    isCajero: (state) => state.user?.rol === "cajero",
    isMesero: (state) => state.user?.rol === "mesero",
    isCocina: (state) => state.user?.rol === "cocina"
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
          try {
            const parsed = JSON.parse(rawUser)
            if (parsed && typeof parsed === "object") {
              this.user = parsed
            } else {
              throw new Error("Invalid user data")
            }
          } catch {
            this.user = null
            localStorage.removeItem("user")
          }
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
        const response = await fetch(`${API_BASE}/auth/login`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            email,
            password
          })
        })

        if (!response.ok) {
          const errorData: ErrorResponse = await response.json()
          return {
            success: false,
            error: errorData.message || "Credenciales incorrectas"
          }
        }

        const data: LoginResponse = await response.json()
        this.token = data.token
        this.user = data.user

        localStorage.setItem("token", data.token)
        localStorage.setItem("user", JSON.stringify(data.user))

        return { success: true }
      } catch (error) {
        return {
          success: false,
          error: "Error de conexion con el servidor"
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
