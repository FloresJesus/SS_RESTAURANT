const db = require("../config/db")

const getNotifications = async (usuarioRol, limit = 20) => {
  let query = `
    SELECT id, tipo, titulo, mensaje, referencia_id, referencia_tipo,
           leida, creado_en
    FROM notificaciones
    WHERE (usuario_destino IS NULL OR usuario_destino = ?)
    ORDER BY creado_en DESC
    LIMIT ?
  `
  const [rows] = await db.query(query, [usuarioRol, limit])
  return rows
}

const getUnreadCount = async (usuarioRol) => {
  const [rows] = await db.query(
    `SELECT COUNT(*) AS total FROM notificaciones
     WHERE (usuario_destino IS NULL OR usuario_destino = ?) AND leida = 0`,
    [usuarioRol]
  )
  return rows[0].total
}

const markAsRead = async (id) => {
  await db.query(`UPDATE notificaciones SET leida = 1 WHERE id = ?`, [id])
}

const markAllAsRead = async (usuarioRol) => {
  await db.query(
    `UPDATE notificaciones SET leida = 1
     WHERE (usuario_destino IS NULL OR usuario_destino = ?) AND leida = 0`,
    [usuarioRol]
  )
}

const createNotification = async ({ tipo, titulo, mensaje, referencia_id, referencia_tipo, usuario_destino }) => {
  const [result] = await db.query(
    `INSERT INTO notificaciones (tipo, titulo, mensaje, referencia_id, referencia_tipo, usuario_destino)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [tipo, titulo, mensaje, referencia_id, referencia_tipo, usuario_destino || null]
  )
  return result.insertId
}

module.exports = { getNotifications, getUnreadCount, markAsRead, markAllAsRead, createNotification }
