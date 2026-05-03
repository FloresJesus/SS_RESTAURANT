const db = require("../config/db")

const showTables = async () => {
  const [rows] = await db.query(
    `SELECT
      m.id,
      m.nombre,
      m.capacidad,
      m.ubicacion,
      m.activa,
      r.id AS reservation_id,
      r.fecha,
      r.hora,
      r.personas,
      r.estado AS reservation_estado,
      c.nombre AS cliente_nombre,
      c.telefono AS cliente_telefono,
      c.correo AS cliente_correo,
      EXISTS(
        SELECT 1 FROM pedido p
        WHERE p.mesa_id = m.id
          AND p.estado_cocina IN ('abierto','cocina')
      ) AS occupied
    FROM mesa m
    LEFT JOIN reservacion r ON m.id = r.mesa_id
      AND r.fecha = CURDATE()
      AND r.estado IN ('pendiente','confirmada')
    LEFT JOIN cliente c ON r.cliente_id = c.id
    ORDER BY m.id`
  )
  return rows
}

const createTable = async (nombre, capacidad, ubicacion = null, activa = true) => {
  const [result] = await db.query(
    `INSERT INTO mesa (nombre, capacidad, ubicacion, activa)
     VALUES (?, ?, ?, ?)`,
    [nombre, capacidad, ubicacion, activa]
  )
  return result
}

module.exports = {
  showTables,
  createTable
}
