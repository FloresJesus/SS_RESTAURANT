const express = require("express")
const router = express.Router()
const db = require("../config/db")
const { createReservation, checkTableAvailability } = require("../models/reservationModels")
const { createCustomer: createCustomerModel } = require("../models/customerModels")

router.post("/", async (req, res) => {
  const {
    nombre,
    telefono,
    email = null,
    mesa_id,
    fecha_hora_inicio,
    fecha_hora_fin,
    cantidad_personas,
    observaciones = null
  } = req.body

  if (!nombre || !telefono || !fecha_hora_inicio || !fecha_hora_fin || !cantidad_personas) {
    return res.status(400).json({ message: "Los campos nombre, telefono, fecha_hora_inicio, fecha_hora_fin y personas son obligatorios" })
  }

  try {
    const clienteResult = await createCustomerModel(nombre, telefono, email)
    const clienteId = clienteResult.insertId

    let mesaAsignada = mesa_id
    if (!mesaAsignada) {
      const [availableTables] = await db.query(
        `SELECT m.id, m.numero, m.capacidad
         FROM mesa m
         WHERE m.estado != 'mantenimiento'
         AND m.capacidad >= ?
         AND m.id NOT IN (
           SELECT r.mesa_id
           FROM reserva r
           WHERE r.estado IN ('pendiente', 'confirmada')
           AND ? < r.fecha_hora_fin
           AND ? > r.fecha_hora_inicio
         )
         ORDER BY m.capacidad ASC
         LIMIT 1`,
        [cantidad_personas, fecha_hora_inicio, fecha_hora_fin]
      )
      if (availableTables.length > 0) {
        mesaAsignada = availableTables[0].id
      }
    }

    if (!mesaAsignada) {
      return res.status(400).json({ message: "No hay mesas disponibles en ese horario" })
    }

    const disponible = await checkTableAvailability(mesaAsignada, fecha_hora_inicio, fecha_hora_fin)
    if (!disponible) {
      return res.status(409).json({ message: "La mesa ya no esta disponible en ese horario" })
    }

    const reservationResult = await createReservation(
      clienteId,
      mesaAsignada,
      cantidad_personas,
      fecha_hora_inicio,
      fecha_hora_fin,
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
