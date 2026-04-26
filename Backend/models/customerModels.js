const db = require("../config/db")

const createCustomer = async (nombre, telefono, correo = null, notas = null) => {
  const [result] = await db.query(
    "INSERT INTO cliente (nombre, telefono, correo, notas) VALUES (?, ?, ?, ?)",
    [nombre, telefono, correo, notas]
  )
  return result
}

const updateCustomer = async (id, nombre, telefono, correo = null, notas = null) => {
  const [result] = await db.query(
    "UPDATE cliente SET nombre = ?, telefono = ?, correo = ?, notas = ? WHERE id = ?",
    [nombre, telefono, correo, notas, id]
  )
  return result
}

const findCustomerById = async (id) => {
  const [rows] = await db.query(
    "SELECT id, nombre, telefono, correo, notas, creado_en FROM cliente WHERE id = ?",
    [id]
  )
  return rows[0]
}

const showCustomers = async () => {
  const [rows] = await db.query(
    "SELECT id, nombre, telefono, correo, notas, creado_en FROM cliente ORDER BY creado_en DESC"
  )
  return rows
}

const deleteCustomer = async (id) => {
  const [result] = await db.query(
    "DELETE FROM cliente WHERE id = ?",
    [id]
  )
  return result
}

module.exports = {
  createCustomer,
  updateCustomer,
  findCustomerById,
  showCustomers,
  deleteCustomer
}