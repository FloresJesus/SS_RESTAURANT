const db = require("../config/db")

const showTables = async () => {
  const [rows] = await db.query(
    `SELECT 
      m.id,
      m.numero,
      m.capacidad,
      m.estado,
      COALESCE(
        (SELECT COUNT(*) FROM pedido p 
         WHERE p.mesa_id = m.id 
         AND p.estado_servicio IN ('pendiente', 'preparando', 'listo')
         AND DATE(p.creado_en) = CURDATE()), 0
      ) > 0 AS tiene_pedido_activo
    FROM mesa m
    ORDER BY m.numero`
  )
  return rows
}

const findTableById = async (id) => {
  const [rows] = await db.query(
    `SELECT id, numero, capacidad, estado FROM mesa WHERE id = ?`,
    [id]
  )
  return rows[0]
}

const findTableByNumero = async (numero) => {
  const [rows] = await db.query(
    `SELECT id, numero, capacidad, estado FROM mesa WHERE numero = ?`,
    [numero]
  )
  return rows[0]
}

const createTable = async (numero, capacidad, estado = 'libre') => {
  const [result] = await db.query(
    `INSERT INTO mesa (numero, capacidad, estado)
     VALUES (?, ?, ?)`,
    [numero, capacidad, estado]
  )
  return result
}

const updateTable = async (id, numero, capacidad, estado) => {
  const [result] = await db.query(
    `UPDATE mesa
     SET numero = ?, capacidad = ?, estado = ?
     WHERE id = ?`,
    [numero, capacidad, estado, id]
  )
  return result
}

const updateTableStatus = async (id, estado) => {
  const validStates = ['libre', 'ocupada', 'mantenimiento']
  if (!validStates.includes(estado)) {
    throw new Error('Estado invalido. Estados validos: libre, ocupada, mantenimiento')
  }
  const [result] = await db.query(
    `UPDATE mesa SET estado = ? WHERE id = ?`,
    [estado, id]
  )
  return result
}

const deleteTable = async (id) => {
  const [result] = await db.query(
    `DELETE FROM mesa WHERE id = ?`,
    [id]
  )
  return result
}

const getTablesByStatus = async (estado) => {
  const [rows] = await db.query(
    `SELECT id, numero, capacidad, estado
     FROM mesa
     WHERE estado = ?
     ORDER BY numero`,
    [estado]
  )
  return rows
}

const getAvailableTables = async () => {
  return getTablesByStatus('libre')
}

module.exports = {
  showTables,
  findTableById,
  findTableByNumero,
  createTable,
  updateTable,
  updateTableStatus,
  deleteTable,
  getTablesByStatus,
  getAvailableTables
}
