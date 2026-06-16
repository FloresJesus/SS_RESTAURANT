import { createRouter, createWebHistory } from "vue-router"

import LoginView from "@/views/LoginView.vue"
import DashboardView from "@/views/DashboardView.vue"
import MenuView from "@/views/MenuView.vue"
import OrdersView from "@/views/OrdersView.vue"
import TablesView from "@/views/TablesView.vue"
import EmployeesView from "@/views/EmployeesView.vue"
import AdminLayout from "@/layouts/AdminLayout.vue"
import CustomersView from "@/views/CustomersView.vue"
import ReservationView from "@/views/ReservationView.vue"
import ReservationsView from "@/views/ReservationsView.vue"
import SettingsView from "@/views/SettingsView.vue"
import ReportsView from "@/views/ReportsView.vue"
import AuditView from "@/views/AuditView.vue"

type UserRole = 'admin' | 'cajero' | 'mesero' | 'cocina'

const ROLE_ACCESS: Record<string, string[]> = {
  admin: ["dashboard", "customers", "menu", "orders", "tables", "reservations", "employees", "reports", "settings", "audit"],
  cajero: ["dashboard", "orders", "payments"],
  mesero: ["dashboard", "customers", "menu", "orders", "tables", "reservations"],
  cocina: ["dashboard", "orders"]
}

const router = createRouter({

  history: createWebHistory(),

  routes: [

    {
      path: "/login",
      component: LoginView
    },

    {
      path: "/reservar",
      component: ReservationView
    },

    {
      path: "/",
      component: AdminLayout,
      children: [
        {
          path: "",
          component: DashboardView,
          meta: { roles: ["admin", "cajero", "mesero", "cocina"] }
        },
        {
          path: "customers",
          component: CustomersView,
          meta: { roles: ["admin", "cajero", "mesero"] }
        },
        {
          path: "menu",
          component: MenuView,
          meta: { roles: ["admin", "cajero", "mesero", "cocina"] }
        },
        {
          path: "orders",
          component: OrdersView,
          meta: { roles: ["admin", "cajero", "mesero", "cocina"] }
        },
        {
          path: "tables",
          component: TablesView,
          meta: { roles: ["admin", "cajero", "mesero"] }
        },
        {
          path: "reservations",
          component: ReservationsView,
          meta: { roles: ["admin", "cajero", "mesero"] }
        },
        {
          path: "employees",
          component: EmployeesView,
          meta: { roles: ["admin"] }
        },
        {
          path: "reports",
          component: ReportsView,
          meta: { roles: ["admin"] }
        },
        {
          path: "settings",
          component: SettingsView,
          meta: { roles: ["admin"] }
        },
        {
          path: "audit",
          component: AuditView,
          meta: { roles: ["admin"] }
        }
      ]
    }

  ]

})

router.beforeEach((to, from, next) => {
  const token = localStorage.getItem("token")
  let user = null
  try {
    const rawUser = localStorage.getItem("user")
    user = rawUser ? JSON.parse(rawUser) : null
  } catch {
    user = null
  }

  if (to.path === "/login") {
    if (token) {
      next("/")
    } else {
      next()
    }
    return
  }

  if (to.path === "/reservar") {
    next()
    return
  }

  if (!token) {
    next("/login")
    return
  }

  if (to.meta.roles && user?.rol) {
    const allowed = to.meta.roles as string[]
    if (!allowed.includes(user.rol)) {
      next("/")
      return
    }
  }

  next()

})

export default router
