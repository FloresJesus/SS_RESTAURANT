const db = require("../config/db")

const showCustomers = async () => {
  const [rows] = await db.query(
    `SELECT id, nombre, telefono, email, creado_en
     FROM cliente
     ORDER BY creado_en DESC`
  )
  return rows
}

const findCustomerById = async (id) => {
  const [rows] = await db.query(
    `SELECT id, nombre, telefono, email, creado_en
     FROM cliente WHERE id = ?`,
    [id]
  )
  return rows[0]
}

const findCustomerByEmail = async (email) => {
  const [rows] = await db.query(
    `SELECT id, nombre, telefono, email, creado_en
     FROM cliente WHERE email = ?`,
    [email]
  )
  return rows[0]
}

const findCustomerByPhone = async (telefono) => {
  const [rows] = await db.query(
    `SELECT id, nombre, telefono, email, creado_en
     FROM cliente WHERE telefono = ?`,
    [telefono]
  )
  return rows[0]
}

const createCustomer = async (nombre, telefono, email = null) => {
  const [result] = await db.query(
    `INSERT INTO cliente (nombre, telefono, email)
     VALUES (?, ?, ?)`,
    [nombre, telefono, email]
  )
  return result
}

const updateCustomer = async (id, nombre, telefono, email = null) => {
  const [result] = await db.query(
    `UPDATE cliente
     SET nombre = ?, telefono = ?, email = ?
     WHERE id = ?`,
    [nombre, telefono, email, id]
  )
  return result
}

const deleteCustomer = async (id) => {
  const [result] = await db.query(
    `DELETE FROM cliente WHERE id = ?`,
    [id]
  )
  return result
}

const searchCustomers = async (searchTerm) => {
  const [rows] = await db.query(
    `SELECT id, nombre, telefono, email, creado_en
     FROM cliente
     WHERE nombre LIKE ? OR telefono LIKE ? OR email LIKE ?
     ORDER BY nombre`,
    [`%${searchTerm}%`, `%${searchTerm}%`, `%${searchTerm}%`]
  )
  return rows
}

module.exports = {
  showCustomers,
  findCustomerById,
  findCustomerByEmail,
  findCustomerByPhone,
  createCustomer,
  updateCustomer,
  deleteCustomer,
  searchCustomers
}
