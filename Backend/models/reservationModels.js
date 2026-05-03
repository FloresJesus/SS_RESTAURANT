const db = require("../config/db")

const showReservations = async () => {
  const [rows] = await db.query(
    `SELECT
      r.id,
      r.cliente_id,
      c.nombre AS nombre,
      c.telefono AS telefono,
      c.correo AS correo,
      r.mesa_id,
      m.nombre AS mesa_nombre,
      r.fecha,
      r.hora,
      r.personas,
      r.estado,
      r.notas,
      r.creado_en
    FROM reservacion r
    JOIN cliente c ON r.cliente_id = c.id
    LEFT JOIN mesa m ON r.mesa_id = m.id
    ORDER BY r.fecha DESC, r.hora DESC`
  )
  return rows
}

const findReservationById = async (id) => {
  const [rows] = await db.query(
    `SELECT * FROM reservacion WHERE id = ?`,
    [id]
  )
  return rows[0]
}

const createCustomer = async (nombre, telefono, correo = null) => {
  const [result] = await db.query(
    `INSERT INTO cliente (nombre, telefono, correo) VALUES (?, ?, ?)`,
    [nombre, telefono, correo]
  )
  return result.insertId
}

const createReservation = async (
  cliente_id,
  mesa_id,
  fecha,
  hora,
  personas,
  estado = "pendiente",
  notas = null
) => {
  const [result] = await db.query(
    `INSERT INTO reservacion (cliente_id, mesa_id, fecha, hora, personas, estado, notas)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [cliente_id, mesa_id, fecha, hora, personas, estado, notas]
  )
  return result
}

const updateReservation = async (
  id,
  mesa_id,
  fecha,
  hora,
  personas,
  estado,
  notas
) => {
  const [result] = await db.query(
    `UPDATE reservacion
     SET mesa_id = ?, fecha = ?, hora = ?, personas = ?, estado = ?, notas = ?
     WHERE id = ?`,
    [mesa_id, fecha, hora, personas, estado, notas, id]
  )
  return result
}

const deleteReservation = async (id) => {
  const [result] = await db.query(
    `DELETE FROM reservacion WHERE id = ?`,
    [id]
  )
  return result
}

const getAvailableTables = async (fecha, hora) => {
  const [rows] = await db.query(
    `SELECT m.id, m.nombre, m.capacidad, m.ubicacion
     FROM mesa m
     WHERE m.activa = 1
     AND m.id NOT IN (
       SELECT r.mesa_id FROM reservacion r
       WHERE r.fecha = ?
       AND r.estado IN ('pendiente', 'confirmada')
     )
     ORDER BY m.capacidad ASC`,
    [fecha]
  )
  return rows
}

module.exports = {
  showReservations,
  findReservationById,
  createCustomer,
  createReservation,
  updateReservation,
  deleteReservation,
  getAvailableTables
}
