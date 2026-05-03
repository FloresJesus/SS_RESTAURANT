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

const ROLE_ACCESS: Record<string, string[]> = {
  admin: ["dashboard", "customers", "menu", "orders", "tables", "employees"],
  camarero: ["dashboard", "customers", "menu", "orders", "tables"],
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
          meta: { roles: ["admin", "camarero", "cocina"] }
        },
        {
          path: "customers",
          component: CustomersView,
          meta: { roles: ["admin", "camarero"] }
        },
        {
          path: "menu",
          component: MenuView,
          meta: { roles: ["admin", "camarero", "cocina"] }
        },
        {
          path: "orders",
          component: OrdersView,
          meta: { roles: ["admin", "camarero", "cocina"] }
        },
        {
          path: "tables",
          component: TablesView,
          meta: { roles: ["admin", "camarero"] }
        },
        {
          path: "employees",
          component: EmployeesView,
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
