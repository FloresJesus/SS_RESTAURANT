const db = require("../config/db")

const showReservations = async () => {
  const [rows] = await db.query(
    `SELECT r.id, r.cliente_id, r.mesa_id, r.cantidad_personas,
            r.fecha_reserva, r.hora_reserva, r.estado, r.observaciones, r.creado_en,
            c.nombre AS cliente_nombre, c.telefono AS cliente_telefono, c.email AS cliente_email,
            m.numero AS mesa_numero
     FROM reserva r
     LEFT JOIN cliente c ON r.cliente_id = c.id
     LEFT JOIN mesa m ON r.mesa_id = m.id
     ORDER BY r.fecha_reserva DESC, r.hora_reserva DESC`
  )
  return rows
}

const findReservationById = async (id) => {
  const [rows] = await db.query(
    `SELECT r.id, r.cliente_id, r.mesa_id, r.cantidad_personas,
            r.fecha_reserva, r.hora_reserva, r.estado, r.observaciones, r.creado_en,
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
            r.fecha_reserva, r.hora_reserva, r.estado, r.observaciones, r.creado_en,
            m.numero AS mesa_numero
     FROM reserva r
     LEFT JOIN mesa m ON r.mesa_id = m.id
     WHERE r.cliente_id = ?
     ORDER BY r.fecha_reserva DESC`,
    [cliente_id]
  )
  return rows
}

const createReservation = async (cliente_id, mesa_id, cantidad_personas, fecha_reserva, hora_reserva, estado = 'pendiente', observaciones = null) => {
  const [result] = await db.query(
    `INSERT INTO reserva (cliente_id, mesa_id, cantidad_personas, fecha_reserva, hora_reserva, estado, observaciones)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [cliente_id, mesa_id, cantidad_personas, fecha_reserva, hora_reserva, estado, observaciones]
  )
  return result
}

const updateReservation = async (id, mesa_id, cantidad_personas, fecha_reserva, hora_reserva, estado, observaciones = null) => {
  const [result] = await db.query(
    `UPDATE reserva
     SET mesa_id = ?, cantidad_personas = ?, fecha_reserva = ?, hora_reserva = ?, estado = ?, observaciones = ?
     WHERE id = ?`,
    [mesa_id, cantidad_personas, fecha_reserva, hora_reserva, estado, observaciones, id]
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

const getReservationsByDate = async (fecha_reserva) => {
  const [rows] = await db.query(
    `SELECT r.id, r.cliente_id, r.mesa_id, r.cantidad_personas,
            r.fecha_reserva, r.hora_reserva, r.estado, r.observaciones, r.creado_en,
            c.nombre AS cliente_nombre, c.telefono AS cliente_telefono, c.email AS cliente_email,
            m.numero AS mesa_numero
     FROM reserva r
     LEFT JOIN cliente c ON r.cliente_id = c.id
     LEFT JOIN mesa m ON r.mesa_id = m.id
     WHERE r.fecha_reserva = ?
     ORDER BY r.hora_reserva`,
    [fecha_reserva]
  )
  return rows
}

const getAvailableTablesForReservation = async (fecha_reserva, hora_reserva, cantidad_personas) => {
  const [rows] = await db.query(
    `SELECT m.id, m.numero, m.capacidad
     FROM mesa m
     WHERE m.estado != 'mantenimiento'
     AND m.capacidad >= ?
     AND m.id NOT IN (
       SELECT r.mesa_id
       FROM reserva r
       WHERE r.fecha_reserva = ?
       AND r.estado IN ('pendiente', 'confirmada')
     )
     ORDER BY m.capacidad ASC`,
    [cantidad_personas, fecha_reserva]
  )
  return rows
}

const getPendingReservations = async () => {
  const [rows] = await db.query(
    `SELECT r.id, r.cliente_id, r.mesa_id, r.cantidad_personas,
            r.fecha_reserva, r.hora_reserva, r.estado, r.observaciones, r.creado_en,
            c.nombre AS cliente_nombre, c.telefono AS cliente_telefono, c.email AS cliente_email,
            m.numero AS mesa_numero
     FROM reserva r
     LEFT JOIN cliente c ON r.cliente_id = c.id
     LEFT JOIN mesa m ON r.mesa_id = m.id
     WHERE r.estado = 'pendiente'
     ORDER BY r.fecha_reserva, r.hora_reserva`
  )
  return rows
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
  getPendingReservations
}
