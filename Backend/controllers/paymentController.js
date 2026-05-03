const { createPayment, getPaymentsByOrderId, getTotalPaymentByOrderId, updatePaymentStatus } = require("../models/paymentModels")
const { findOrderById } = require("../models/orderModels")

const processPayment = async (req, res) => {
  const { pedido_id, monto, metodo, referencia = null } = req.body

  if (!pedido_id || !monto || !metodo) {
    return res.status(400).json({ message: "pedido_id, monto y metodo son obligatorios" })
  }

  try {
    const order = await findOrderById(pedido_id)
    if (!order) {
      return res.status(404).json({ message: "Pedido no encontrado" })
    }

    const paymentId = await createPayment(pedido_id, Number(monto), metodo, referencia)
    
    const totalPagado = await getTotalPaymentByOrderId(pedido_id)
    let nuevoEstado = "pendiente"
    
    if (totalPagado >= order.total) {
      nuevoEstado = "pagado"
    } else if (totalPagado > 0) {
      nuevoEstado = "parcial"
    }

    await updatePaymentStatus(pedido_id, nuevoEstado)

    res.status(201).json({
      message: "Pago registrado",
      paymentId,
      estado_pago: nuevoEstado,
      totalPagado
    })
  } catch (error) {
    console.error(error)
    res.status(500).json({ message: "Error al procesar pago" })
  }
}

const getPayments = async (req, res) => {
  const { pedido_id } = req.query

  try {
    if (pedido_id) {
      const payments = await getPaymentsByOrderId(pedido_id)
      return res.json(payments)
    }
    
    res.status(400).json({ message: "Debe proporcionar pedido_id" })
  } catch (error) {
    console.error(error)
    res.status(500).json({ message: "Error al obtener pagos" })
  }
}

module.exports = {
  processPayment,
  getPayments
}
