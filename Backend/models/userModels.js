const db = require("../config/db")

const createUser = async (nombre, apellido, correo, clave_hash, rol = 'camarero', activo = true) => {
  const [result] = await db.query(
    "INSERT INTO usuario (nombre, apellido, correo, clave_hash, rol, activo) VALUES (?, ?, ?, ?, ?, ?)",
    [nombre, apellido, correo, clave_hash, rol, activo]
  )
  return result
}

const updateUser = async (id, nombre, apellido, correo, rol = 'camarero', activo = true) => {
  const [result] = await db.query(
    "UPDATE usuario SET nombre = ?, apellido = ?, correo = ?, rol = ?, activo = ? WHERE id = ?",
    [nombre, apellido, correo, rol, activo, id]
  )
  return result
}

const findUserById = async (id) => {
  const [rows] = await db.query(
    "SELECT id, nombre, apellido, correo, rol, activo FROM usuario WHERE id = ?",
    [id]
  )
  return rows[0]
}

const findUserByEmail = async (email) => {
  const [rows] = await db.query(
    "SELECT * FROM usuario WHERE correo = ?",
    [email]
  )
  return rows[0]
}

const showUsers = async () => {
  const [rows] = await db.query(
    "SELECT id, nombre, apellido, correo, rol, activo FROM usuario"
  )
  return rows
}

module.exports = {
  createUser,
  updateUser,
  findUserById,
  findUserByEmail,
  showUsers
}