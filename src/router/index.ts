import { createRouter, createWebHistory } from "vue-router"

import LoginView from "@/views/LoginView.vue"
import DashboardView from "@/views/DashboardView.vue"
import MenuView from "@/views/MenuView.vue"
import OrdersView from "@/views/OrdersView.vue"
import TablesView from "@/views/TablesView.vue"
import EmployeesView from "@/views/EmployeesView.vue"
import AdminLayout from "@/layouts/AdminLayout.vue"

const router = createRouter({

  history: createWebHistory(),

  routes: [

    {
      path: "/login",
      component: LoginView
    },

    {
      path: "/",
      component: AdminLayout,
      children: [
        {
          path: "",
          component: DashboardView
        },
        {
          path: "menu",
          component: MenuView
        },
        {
          path: "orders",
          component: OrdersView
        },
        {
          path: "tables",
          component: TablesView
        },
        {
          path: "employees",
          component: EmployeesView
        }
      ]
    }

  ]

})

router.beforeEach((to, from, next) => {

  const token = localStorage.getItem("token")

  if (to.path !== "/login" && !token) {

    next("/login")

  } else if (to.path === "/login" && token) {

    next("/")

  } else {

    next()

  }

})

export default router