const db = require("../config/db")

const getSettings = async () => {
  const [rows] = await db.query(
    `SELECT nombre_restaurante, direccion, telefono, nit FROM configuracion WHERE id = 1`
  )
  return rows[0] || {}
}

const updateSettings = async (nombre_restaurante, direccion, telefono, nit) => {
  const [result] = await db.query(
    `UPDATE configuracion SET nombre_restaurante = ?, direccion = ?, telefono = ?, nit = ? WHERE id = 1`,
    [nombre_restaurante, direccion, telefono, nit]
  )
  return result
}

module.exports = { getSettings, updateSettings }
