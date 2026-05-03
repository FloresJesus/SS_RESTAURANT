const db = require("../config/db")

const createPayment = async (pedido_id, monto, metodo, referencia = null) => {
  const [result] = await db.query(
    `INSERT INTO pago (pedido_id, monto, metodo, referencia)
     VALUES (?, ?, ?, ?)`,
    [pedido_id, monto, metodo, referencia]
  )
  return result.insertId
}

const getPaymentsByOrderId = async (pedido_id) => {
  const [rows] = await db.query(
    `SELECT id, pedido_id, monto, metodo, referencia, DATE_FORMAT(fecha_pago, '%Y-%m-%d %H:%i') AS fecha_pago
     FROM pago
     WHERE pedido_id = ?
     ORDER BY fecha_pago DESC`,
    [pedido_id]
  )
  return rows
}

const getTotalPaymentByOrderId = async (pedido_id) => {
  const [rows] = await db.query(
    `SELECT COALESCE(SUM(monto), 0) as total_pagado
     FROM pago
     WHERE pedido_id = ?`,
    [pedido_id]
  )
  return rows[0].total_pagado
}

const updatePaymentStatus = async (pedido_id, estado_pago) => {
  const [result] = await db.query(
    `UPDATE pedido SET estado_pago = ? WHERE id = ?`,
    [estado_pago, pedido_id]
  )
  return result
}

module.exports = {
  createPayment,
  getPaymentsByOrderId,
  getTotalPaymentByOrderId,
  updatePaymentStatus
}
