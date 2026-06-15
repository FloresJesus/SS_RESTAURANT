const db = require("../config/db")

const showReservations = async () => {
  const [rows] = await db.query(
    `SELECT r.id, r.cliente_id, r.mesa_id, r.cantidad_personas,
            r.fecha_hora_inicio, r.fecha_hora_fin, r.estado, r.observaciones, r.creado_en,
            c.nombre AS cliente_nombre, c.telefono AS cliente_telefono, c.email AS cliente_email,
            m.numero AS mesa_numero
     FROM reserva r
     LEFT JOIN cliente c ON r.cliente_id = c.id
     LEFT JOIN mesa m ON r.mesa_id = m.id
     ORDER BY r.fecha_hora_inicio DESC`
  )
  return rows
}

const findReservationById = async (id) => {
  const [rows] = await db.query(
    `SELECT r.id, r.cliente_id, r.mesa_id, r.cantidad_personas,
            r.fecha_hora_inicio, r.fecha_hora_fin, r.estado, r.observaciones, r.creado_en,
            c.nombre AS cliente_nombre, c.telefono AS cliente_telefono, c.email AS cliente_email,
            m.numero AS mesa_numero
     FROM reserva r
     LEFT JOIN cliente c ON r.cliente_id = c.id
     LEFT JOIN mesa m ON r.mesa_id = m.id
     WHERE r.id = ?`,
    [id]
  )
  return rows[0]
}

const findReservationByClientId = async (cliente_id) => {
  const [rows] = await db.query(
    `SELECT r.id, r.cliente_id, r.mesa_id, r.cantidad_personas,
            r.fecha_hora_inicio, r.fecha_hora_fin, r.estado, r.observaciones, r.creado_en,
            m.numero AS mesa_numero
     FROM reserva r
     LEFT JOIN mesa m ON r.mesa_id = m.id
     WHERE r.cliente_id = ?
     ORDER BY r.fecha_hora_inicio DESC`,
    [cliente_id]
  )
  return rows
}

const createReservation = async (cliente_id, mesa_id, cantidad_personas, fecha_hora_inicio, fecha_hora_fin, estado = 'pendiente', observaciones = null) => {
  const [result] = await db.query(
    `INSERT INTO reserva (cliente_id, mesa_id, cantidad_personas, fecha_hora_inicio, fecha_hora_fin, estado, observaciones)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [cliente_id, mesa_id, cantidad_personas, fecha_hora_inicio, fecha_hora_fin, estado, observaciones]
  )
  return result
}

const updateReservation = async (id, mesa_id, cantidad_personas, fecha_hora_inicio, fecha_hora_fin, estado, observaciones = null) => {
  const [result] = await db.query(
    `UPDATE reserva
     SET mesa_id = ?, cantidad_personas = ?, fecha_hora_inicio = ?, fecha_hora_fin = ?, estado = ?, observaciones = ?
     WHERE id = ?`,
    [mesa_id, cantidad_personas, fecha_hora_inicio, fecha_hora_fin, estado, observaciones, id]
  )
  return result
}

const updateReservationStatus = async (id, estado) => {
  const validStates = ['pendiente', 'confirmada', 'cancelada', 'completada', 'no_asistio']
  if (!validStates.includes(estado)) {
    throw new Error('Estado invalido')
  }
  const [result] = await db.query(
    `UPDATE reserva SET estado = ? WHERE id = ?`,
    [estado, id]
  )
  return result
}

const deleteReservation = async (id) => {
  const [result] = await db.query(
    `DELETE FROM reserva WHERE id = ?`,
    [id]
  )
  return result
}

const getReservationsByDate = async (fecha) => {
  const [rows] = await db.query(
    `SELECT r.id, r.cliente_id, r.mesa_id, r.cantidad_personas,
            r.fecha_hora_inicio, r.fecha_hora_fin, r.estado, r.observaciones, r.creado_en,
            c.nombre AS cliente_nombre, c.telefono AS cliente_telefono, c.email AS cliente_email,
            m.numero AS mesa_numero
     FROM reserva r
     LEFT JOIN cliente c ON r.cliente_id = c.id
     LEFT JOIN mesa m ON r.mesa_id = m.id
     WHERE DATE(r.fecha_hora_inicio) = ?
     ORDER BY r.fecha_hora_inicio`,
    [fecha]
  )
  return rows
}

const checkTableAvailability = async (mesa_id, fecha_hora_inicio, fecha_hora_fin, excludeReservaId = null) => {
  let sql = `SELECT COUNT(*) AS conflictos
     FROM reserva r
     WHERE r.mesa_id = ?
     AND r.estado IN ('pendiente', 'confirmada')
     AND ? < r.fecha_hora_fin
     AND ? > r.fecha_hora_inicio`
  const params = [mesa_id, fecha_hora_inicio, fecha_hora_fin]
  if (excludeReservaId) {
    sql += ` AND r.id != ?`
    params.push(excludeReservaId)
  }
  const [rows] = await db.query(sql, params)
  return rows[0].conflictos === 0
}

const getAvailableTablesForReservation = async (fecha_hora_inicio, fecha_hora_fin, cantidad_personas) => {
  const [rows] = await db.query(
    `SELECT m.id, m.numero, m.capacidad
     FROM mesa m
     WHERE m.estado != 'mantenimiento'
     AND m.capacidad >= ?
     AND m.id NOT IN (
       SELECT r.mesa_id
       FROM reserva r
       WHERE r.estado IN ('pendiente', 'confirmada')
       AND ? < r.fecha_hora_fin
       AND ? > r.fecha_hora_inicio
     )
     ORDER BY m.capacidad ASC`,
    [cantidad_personas, fecha_hora_inicio, fecha_hora_fin]
  )
  return rows
}

const findReservationsByTableAndDate = async (mesa_id, fecha) => {
  const [rows] = await db.query(
    `SELECT r.id, r.cliente_id, r.mesa_id, r.cantidad_personas,
            r.fecha_hora_inicio, r.fecha_hora_fin, r.estado, r.observaciones,
            c.nombre AS cliente_nombre, c.telefono AS cliente_telefono
     FROM reserva r
     LEFT JOIN cliente c ON r.cliente_id = c.id
     WHERE r.mesa_id = ? AND DATE(r.fecha_hora_inicio) = ?
     ORDER BY r.fecha_hora_inicio`,
    [mesa_id, fecha]
  )
  return rows
}

const getPendingReservations = async () => {
  const [rows] = await db.query(
    `SELECT r.id, r.cliente_id, r.mesa_id, r.cantidad_personas,
            r.fecha_hora_inicio, r.fecha_hora_fin, r.estado, r.observaciones, r.creado_en,
            c.nombre AS cliente_nombre, c.telefono AS cliente_telefono, c.email AS cliente_email,
            m.numero AS mesa_numero
     FROM reserva r
     LEFT JOIN cliente c ON r.cliente_id = c.id
     LEFT JOIN mesa m ON r.mesa_id = m.id
     WHERE r.estado = 'pendiente'
     ORDER BY r.fecha_hora_inicio`
  )
  return rows
}

const markExpiredNoShow = async () => {
  const [result] = await db.query(
    `UPDATE reserva SET estado = 'no_asistio'
     WHERE estado IN ('pendiente', 'confirmada')
     AND fecha_hora_fin < NOW()`
  )
  return result.affectedRows
}

module.exports = {
  showReservations,
  findReservationById,
  findReservationByClientId,
  createReservation,
  updateReservation,
  updateReservationStatus,
  deleteReservation,
  getReservationsByDate,
  getAvailableTablesForReservation,
  checkTableAvailability,
  getPendingReservations,
  findReservationsByTableAndDate,
  markExpiredNoShow
}
