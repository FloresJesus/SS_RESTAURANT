const db = require("../config/db")

const createAuditLog = async (usuario_id, accion, tabla, registro_id, detalle, direccion_ip) => {
  const [result] = await db.query(
    `INSERT INTO auditoria (usuario_id, accion, tabla, registro_id, detalle, direccion_ip)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [usuario_id, accion, tabla, registro_id, detalle, direccion_ip]
  )
  return result
}

const getAuditLogs = async () => {
  const [rows] = await db.query(
    `SELECT a.id, a.usuario_id, u.nombre AS usuario_nombre, u.email AS usuario_email,
            a.accion, a.tabla, a.registro_id, a.detalle, a.direccion_ip, a.creado_en
     FROM auditoria a
     LEFT JOIN usuario u ON a.usuario_id = u.id
     ORDER BY a.creado_en DESC`
  )
  return rows
}

const getAuditLogsWithFilters = async (filters) => {
  let sql = `SELECT a.id, a.usuario_id, u.nombre AS usuario_nombre, u.email AS usuario_email,
                    a.accion, a.tabla, a.registro_id, a.detalle, a.direccion_ip, a.creado_en
             FROM auditoria a
             LEFT JOIN usuario u ON a.usuario_id = u.id
             WHERE 1=1`
  const params = []

  if (filters.accion) {
    sql += ` AND a.accion = ?`
    params.push(filters.accion)
  }
  if (filters.tabla) {
    sql += ` AND a.tabla = ?`
    params.push(filters.tabla)
  }
  if (filters.usuario_id) {
    sql += ` AND a.usuario_id = ?`
    params.push(filters.usuario_id)
  }
  if (filters.desde) {
    sql += ` AND a.creado_en >= ?`
    params.push(filters.desde)
  }
  if (filters.hasta) {
    sql += ` AND a.creado_en <= ?`
    params.push(filters.hasta)
  }

  sql += ` ORDER BY a.creado_en DESC`

  const [rows] = await db.query(sql, params)
  return rows
}

module.exports = { createAuditLog, getAuditLogs, getAuditLogsWithFilters }
