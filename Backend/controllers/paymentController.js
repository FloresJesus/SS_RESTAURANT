const db = require("../config/db")
const {
  getPayments,
  getPaymentsByOrderId,
  findPaymentById,
  createPayment,
  deletePayment,
  getTotalPaidByOrderId,
  getDailyPaymentsSummary
} = require("../models/paymentModels")
const { findOrderById, updateOrderPaymentStatus, getOrderTotal } = require("../models/orderModels")
const { createTicket } = require("../models/ticketModels")
const { createInvoice } = require("../models/invoiceModels")

const processPayment = async (req, res) => {
  const { pedido_id, metodo, monto, referencia = null, generar_ticket = false, generar_factura = false, nit_ci = null, razon_social = null } = req.body

  if (!pedido_id || !monto || !metodo) {
    return res.status(400).json({ message: "pedido_id, monto y metodo son obligatorios" })
  }

  const validMethods = ['efectivo', 'tarjeta', 'qr', 'transferencia']
  if (!validMethods.includes(metodo)) {
    return res.status(400).json({ message: `Metodo invalido. Metodos validos: ${validMethods.join(', ')}` })
  }

  const connection = await db.getConnection()

  try {
    await connection.beginTransaction()

    const [orderData] = await connection.query(
      `SELECT id, total FROM pedido WHERE id = ?`,
      [pedido_id]
    )
    if (!orderData[0]) {
      throw new Error("Pedido no encontrado")
    }

    const [details] = await connection.query(
      `SELECT COALESCE(SUM(subtotal), 0) AS total
       FROM detalle_pedido
       WHERE pedido_id = ?`,
      [pedido_id]
    )
    const orderTotal = parseFloat(details[0].total) * 1.13

    if (monto < orderTotal * 0.5) {
      console.warn(`Advertencia: El monto ${monto} es menor al total esperado ${orderTotal}`)
    }

    const [result] = await connection.query(
      `INSERT INTO pago (pedido_id, metodo, monto, referencia)
       VALUES (?, ?, ?, ?)`,
      [pedido_id, metodo, monto, referencia]
    )
    const paymentId = result.insertId

    const [paymentsTotal] = await connection.query(
      `SELECT COALESCE(SUM(monto), 0) AS total_pagado
       FROM pago
       WHERE pedido_id = ?`,
      [pedido_id]
    )
    const totalPagado = parseFloat(paymentsTotal[0].total_pagado) + monto

    let estado_pago = 'pendiente'
    if (totalPagado >= orderTotal) {
      estado_pago = 'pagado'
    }

    await connection.query(
      `UPDATE pedido SET estado_pago = ? WHERE id = ?`,
      [estado_pago, pedido_id]
    )

    let ticketInfo = null
    let invoiceInfo = null

    if (generar_ticket && estado_pago === 'pagado') {
      try {
        const [ticketResult] = await connection.query(
          `SELECT id, numero_ticket, numero_diario, fecha
           FROM ticket WHERE pedido_id = ?`,
          [pedido_id]
        )
        if (!ticketResult[0]) {
          const today = new Date().toISOString().split('T')[0]
          const [maxNum] = await connection.query(
            `SELECT COALESCE(MAX(numero_diario), 0) + 1 AS siguiente FROM ticket WHERE fecha = ?`,
            [today]
          )
          const numeroTicket = `${today.replace(/-/g, '')}-${String(maxNum[0].siguiente).padStart(4, '0')}`
          await connection.query(
            `INSERT INTO ticket (pedido_id, numero_diario, fecha, numero_ticket)
             VALUES (?, ?, ?, ?)`,
            [pedido_id, maxNum[0].siguiente, today, numeroTicket]
          )
        }
        const [ticket] = await connection.query(
          `SELECT id, numero_ticket, numero_diario, fecha FROM ticket WHERE pedido_id = ?`,
          [pedido_id]
        )
        if (ticket[0]) {
          ticketInfo = ticket[0]
        }
      } catch (ticketError) {
        console.error("Error al crear ticket:", ticketError)
      }
    }

    if (generar_factura && estado_pago === 'pagado' && nit_ci && razon_social) {
      try {
        const [invoiceResult] = await connection.query(
          `SELECT id, numero_factura FROM factura WHERE pedido_id = ?`,
          [pedido_id]
        )
        if (!invoiceResult[0]) {
          const year = new Date().getFullYear()
          const [maxNum] = await connection.query(
            `SELECT COALESCE(MAX(CAST(SUBSTRING_INDEX(numero_factura, '-', -1) AS UNSIGNED)), 0) + 1 AS siguiente
             FROM factura WHERE numero_factura LIKE ?`,
            [`${year}-%`]
          )
          const numeroFactura = `${year}-${String(maxNum[0].siguiente).padStart(6, '0')}`
          const subtotal = parseFloat(details[0].total)
          const impuesto = parseFloat((subtotal * 0.13).toFixed(2))
          const totalFactura = subtotal + impuesto
          await connection.query(
            `INSERT INTO factura (pedido_id, numero_factura, nit_ci, razon_social, subtotal, impuesto, total)
             VALUES (?, ?, ?, ?, ?, ?, ?)`,
            [pedido_id, numeroFactura, nit_ci, razon_social, subtotal, impuesto, totalFactura]
          )
        }
        const [invoice] = await connection.query(
          `SELECT id, numero_factura, nit_ci, razon_social, subtotal, impuesto, total
           FROM factura WHERE pedido_id = ?`,
          [pedido_id]
        )
        if (invoice[0]) {
          invoiceInfo = invoice[0]
        }
      } catch (invoiceError) {
        console.error("Error al crear factura:", invoiceError)
      }
    }

    await connection.commit()

    res.status(201).json({
      message: "Pago registrado",
      paymentId,
      estado_pago,
      totalPagado,
      ticket: ticketInfo,
      factura: invoiceInfo
    })
  } catch (error) {
    await connection.rollback()
    console.error("Error al procesar pago:", error)
    res.status(500).json({ message: "Error al procesar pago" })
  } finally {
    connection.release()
  }
}

const getPaymentsList = async (req, res) => {
  const { pedido_id } = req.query

  try {
    if (pedido_id) {
      const payments = await getPaymentsByOrderId(pedido_id)
      return res.json(payments)
    }
    const payments = await getPayments()
    res.json(payments)
  } catch (error) {
    console.error("Error al obtener pagos:", error)
    res.status(500).json({ message: "Error al obtener pagos" })
  }
}

const getPaymentById = async (req, res) => {
  const { id } = req.params

  try {
    const payment = await findPaymentById(id)
    if (!payment) {
      return res.status(404).json({ message: "Pago no encontrado" })
    }
    res.json(payment)
  } catch (error) {
    console.error("Error al obtener el pago:", error)
    res.status(500).json({ message: "Error al obtener el pago" })
  }
}

const getDailySummary = async (req, res) => {
  try {
    const summary = await getDailyPaymentsSummary()
    res.json(summary)
  } catch (error) {
    console.error("Error al obtener resumen diario:", error)
    res.status(500).json({ message: "Error al obtener resumen diario" })
  }
}

module.exports = {
  processPayment,
  getPaymentsList,
  getPaymentById,
  getDailySummary
}
