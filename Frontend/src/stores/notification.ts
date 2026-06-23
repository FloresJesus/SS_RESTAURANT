import { defineStore } from 'pinia'
import { ref, onUnmounted } from 'vue'
import { apiFetch, API_BASE } from '@/utils/api'

export interface Notification {
  id: number
  tipo: string
  titulo: string
  mensaje: string
  referencia_id: number | null
  referencia_tipo: string | null
  leida: boolean
  creado_en: string
}

export const useNotificationStore = defineStore('notification', () => {
  const notifications = ref<Notification[]>([])
  const unreadCount = ref(0)
  let pollingInterval: ReturnType<typeof setInterval> | null = null

  const fetchNotifications = async () => {
    try {
      const data = await apiFetch(`${API_BASE}/notifications`)
      notifications.value = data.notifications
      unreadCount.value = data.unreadCount
    } catch {
      // ignore polling errors
    }
  }

  const markAsRead = async (id: number) => {
    try {
      await apiFetch(`${API_BASE}/notifications/${id}/read`, { method: 'PUT' })
      const notif = notifications.value.find(n => n.id === id)
      if (notif) notif.leida = true
      unreadCount.value = Math.max(0, unreadCount.value - 1)
    } catch (error) {
      console.error("Error marcando notificacion:", error)
    }
  }

  const markAllAsRead = async () => {
    try {
      await apiFetch(`${API_BASE}/notifications/read-all`, { method: 'PUT' })
      notifications.value.forEach(n => { n.leida = true })
      unreadCount.value = 0
    } catch (error) {
      console.error("Error marcando notificaciones:", error)
    }
  }

  const startPolling = () => {
    fetchNotifications()
    pollingInterval = setInterval(fetchNotifications, 30000)
  }

  const stopPolling = () => {
    if (pollingInterval) {
      clearInterval(pollingInterval)
      pollingInterval = null
    }
  }

  return { notifications, unreadCount, fetchNotifications, markAsRead, markAllAsRead, startPolling, stopPolling }
})
