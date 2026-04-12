import { defineStore } from "pinia"

interface User {
  id: number
  email: string
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
    token: localStorage.getItem("token") as string | null
  }),

  actions: {

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

    }

  }

})