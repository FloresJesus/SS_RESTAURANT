const db = require("../config/db")

const getPayments = async () => {
  const [rows] = await db.query(
    `SELECT pg.id, pg.pedido_id, pg.metodo, pg.monto, pg.referencia, pg.fecha,
            p.estado_pago, m.numero AS mesa_numero
     FROM pago pg
     JOIN pedido p ON pg.pedido_id = p.id
     LEFT JOIN mesa m ON p.mesa_id = m.id
     ORDER BY pg.fecha DESC`
  )
  return rows
}

const getPaymentsByOrderId = async (pedido_id) => {
  const [rows] = await db.query(
    `SELECT pg.id, pg.pedido_id, pg.metodo, pg.monto, pg.referencia, pg.fecha
     FROM pago pg
     WHERE pg.pedido_id = ?
     ORDER BY pg.fecha DESC`,
    [pedido_id]
  )
  return rows
}

const findPaymentById = async (id) => {
  const [rows] = await db.query(
    `SELECT pg.id, pg.pedido_id, pg.metodo, pg.monto, pg.referencia, pg.fecha
     FROM pago pg
     WHERE pg.id = ?`,
    [id]
  )
  return rows[0]
}

const createPayment = async (pedido_id, metodo, monto, referencia = null) => {
  const validMethods = ['efectivo', 'tarjeta', 'qr', 'transferencia']
  if (!validMethods.includes(metodo)) {
    throw new Error('Metodo de pago invalido. Metodos validos: efectivo, tarjeta, qr, transferencia')
  }
  
  const [result] = await db.query(
    `INSERT INTO pago (pedido_id, metodo, monto, referencia)
     VALUES (?, ?, ?, ?)`,
    [pedido_id, metodo, monto, referencia]
  )
  return result.insertId
}

const deletePayment = async (id) => {
  const [result] = await db.query(
    `DELETE FROM pago WHERE id = ?`,
    [id]
  )
  return result
}

const getTotalPaidByOrderId = async (pedido_id) => {
  const [rows] = await db.query(
    `SELECT COALESCE(SUM(monto), 0) AS total_pagado
     FROM pago
     WHERE pedido_id = ?`,
    [pedido_id]
  )
  return parseFloat(rows[0].total_pagado)
}

const getPaymentsByDate = async (fecha) => {
  const [rows] = await db.query(
    `SELECT pg.id, pg.pedido_id, pg.metodo, pg.monto, pg.referencia, pg.fecha,
            p.estado_pago, m.numero AS mesa_numero
     FROM pago pg
     JOIN pedido p ON pg.pedido_id = p.id
     LEFT JOIN mesa m ON p.mesa_id = m.id
     WHERE DATE(pg.fecha) = ?
     ORDER BY pg.fecha DESC`,
    [fecha]
  )
  return rows
}

const getPaymentsByMethod = async (metodo) => {
  const [rows] = await db.query(
    `SELECT pg.id, pg.pedido_id, pg.metodo, pg.monto, pg.referencia, pg.fecha,
            p.estado_pago, m.numero AS mesa_numero
     FROM pago pg
     JOIN pedido p ON pg.pedido_id = p.id
     LEFT JOIN mesa m ON p.mesa_id = m.id
     WHERE pg.metodo = ?
     ORDER BY pg.fecha DESC`,
    [metodo]
  )
  return rows
}

const getDailyPaymentsSummary = async () => {
  const [rows] = await db.query(
    `SELECT 
       metodo,
       COUNT(*) AS cantidad_pagos,
       SUM(monto) AS total_metodo
     FROM pago
     WHERE DATE(fecha) = CURDATE()
     GROUP BY metodo`
  )
  return rows
}

module.exports = {
  getPayments,
  getPaymentsByOrderId,
  findPaymentById,
  createPayment,
  deletePayment,
  getTotalPaidByOrderId,
  getPaymentsByDate,
  getPaymentsByMethod,
  getDailyPaymentsSummary
}
