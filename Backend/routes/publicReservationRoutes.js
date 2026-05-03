const express = require("express")
const router = express.Router()
const {
  getAvailableTables,
  createCustomer,
  createReservation
} = require("../models/reservationModels")

router.post("/", async (req, res) => {
  const {
    nombre,
    telefono,
    correo = null,
    fecha,
    hora,
    personas,
    notas = null
  } = req.body

  if (!nombre || !telefono || !fecha || !hora || !personas) {
    return res.status(400).json({ message: "Los campos nombre, telefono, fecha, hora y personas son obligatorios" })
  }

  try {
    const tables = await getAvailableTables(fecha, hora)
    const suitableTable = tables.find(t => Number(t.capacidad) >= Number(personas))

    if (!suitableTable) {
      return res.status(400).json({ message: "No hay mesas disponibles para esa cantidad de personas" })
    }

    const clienteId = await createCustomer(nombre, telefono, correo)
    await createReservation(clienteId, suitableTable.id, fecha, hora, personas, "pendiente", notas)
    res.status(201).json({ message: "Reservacion creada correctamente", mesa: suitableTable.numero })
  } catch (error) {
    console.error(error)
    res.status(500).json({ message: "Error al crear la reservacion" })
  }
})

module.exports = router
