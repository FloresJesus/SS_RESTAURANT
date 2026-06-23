const { getNotifications, getUnreadCount, markAsRead, markAllAsRead, createNotification } = require("../models/notificationModel")
const { logAudit } = require("../utils/auditLogger")

const getAllNotifications = async (req, res) => {
  try {
    const usuarioRol = req.user?.rol || ''
    const notifications = await getNotifications(usuarioRol)
    const unreadCount = await getUnreadCount(usuarioRol)
    res.json({ notifications, unreadCount })
  } catch (error) {
    console.error("Error al obtener notificaciones:", error)
    res.status(500).json({ message: "Error al obtener notificaciones" })
  }
}

const markNotificationAsRead = async (req, res) => {
  try {
    const { id } = req.params
    await markAsRead(id)
    res.json({ message: "Notificacion marcada como leida" })
  } catch (error) {
    console.error("Error al marcar notificacion:", error)
    res.status(500).json({ message: "Error al marcar notificacion" })
  }
}

const markAllNotificationsAsRead = async (req, res) => {
  try {
    const usuarioRol = req.user?.rol || ''
    await markAllAsRead(usuarioRol)
    res.json({ message: "Todas las notificaciones marcadas como leidas" })
  } catch (error) {
    console.error("Error al marcar notificaciones:", error)
    res.status(500).json({ message: "Error al marcar notificaciones" })
  }
}

module.exports = { getAllNotifications, markNotificationAsRead, markAllNotificationsAsRead }
