const db = require("../config/db")

const showUsers = async () => {
  const [rows] = await db.query(
    `SELECT id, nombre, apellido, email, rol, activo, creado_en
     FROM usuario
     ORDER BY creado_en DESC`
  )
  return rows
}

const findUserById = async (id) => {
  const [rows] = await db.query(
    `SELECT id, nombre, apellido, email, rol, activo, creado_en
     FROM usuario WHERE id = ?`,
    [id]
  )
  return rows[0]
}

const findUserByEmail = async (email) => {
  const [rows] = await db.query(
    `SELECT * FROM usuario WHERE email = ?`,
    [email]
  )
  return rows[0]
}

const createUser = async (nombre, apellido, email, password_hash, rol = 'mesero', activo = true) => {
  const [result] = await db.query(
    `INSERT INTO usuario (nombre, apellido, email, password_hash, rol, activo)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [nombre, apellido, email, password_hash, rol, activo]
  )
  return result
}

const updateUser = async (id, nombre, apellido, email, rol, activo = true) => {
  const [result] = await db.query(
    `UPDATE usuario
     SET nombre = ?, apellido = ?, email = ?, rol = ?, activo = ?
     WHERE id = ?`,
    [nombre, apellido, email, rol, activo, id]
  )
  return result
}

const updateUserPassword = async (id, newPasswordHash) => {
  const [result] = await db.query(
    `UPDATE usuario SET password_hash = ? WHERE id = ?`,
    [newPasswordHash, id]
  )
  return result
}

const deleteUser = async (id) => {
  const [result] = await db.query(
    `DELETE FROM usuario WHERE id = ?`,
    [id]
  )
  return result
}

const getEmployeesByRole = async (rol) => {
  const [rows] = await db.query(
    `SELECT id, nombre, apellido, email, rol, activo
     FROM usuario
     WHERE rol = ? AND activo = TRUE
     ORDER BY nombre`,
    [rol]
  )
  return rows
}

module.exports = {
  showUsers,
  findUserById,
  findUserByEmail,
  createUser,
  updateUser,
  updateUserPassword,
  deleteUser,
  getEmployeesByRole
}
