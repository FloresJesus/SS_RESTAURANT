const express = require("express")
const router = express.Router()
const {
  getAvailableTablesForReservation,
  createCustomer,
  createReservation
} = require("../models/reservationModels")
const { createCustomer: createCustomerModel } = require("../models/customerModels")

router.post("/", async (req, res) => {
  const {
    nombre,
    telefono,
    email = null,
    mesa_id,
    fecha_reserva,
    hora_reserva,
    cantidad_personas,
    observaciones = null
  } = req.body

  if (!nombre || !telefono || !mesa_id || !fecha_reserva || !hora_reserva || !cantidad_personas) {
    return res.status(400).json({ message: "Los campos nombre, telefono, mesa, fecha, hora y personas son obligatorios" })
  }

  try {
    const clienteResult = await createCustomerModel(nombre, telefono, email)
    const clienteId = clienteResult.insertId

    const reservationResult = await createReservation(
      clienteId,
      mesa_id,
      cantidad_personas,
      fecha_reserva,
      hora_reserva,
      'pendiente',
      observaciones
    )

    res.status(201).json({
      message: "Reservacion creada correctamente",
      id: reservationResult.insertId
    })
  } catch (error) {
    console.error(error)
    res.status(500).json({ message: "Error al crear la reservacion" })
  }
})

module.exports = router