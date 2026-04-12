const db = require("../config/db")

const createUser = async (email, password,nombre) => {
  const [result] = await db.query(
    "INSERT INTO usuario (email, password,nombre) VALUES (?, ?, ?)",
    [email, password,nombre]
  )
  return result
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
    "SELECT * FROM usuario"
  )
  return rows
}

module.exports = {
  createUser,
  findUserByEmail,
  showUsers
}