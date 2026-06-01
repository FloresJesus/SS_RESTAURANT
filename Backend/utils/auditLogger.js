const db = require("../config/db")

const logAudit = async (usuario_id, accion, tabla, registro_id = null, detalle = null, direccion_ip = null) => {
  try {
    await db.query(
      `INSERT INTO auditoria (usuario_id, accion, tabla, registro_id, detalle, direccion_ip)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [usuario_id, accion, tabla, registro_id, detalle, direccion_ip]
    )
  } catch (error) {
    console.error("Error al registrar auditoria:", error)
  }
}

module.exports = { logAudit }
