const {
  showReservations,
  findReservationById,
  createCustomer,
  createReservation,
  updateReservation,
  deleteReservation
} = require("../models/reservationModels")

const getReservations = async (req, res) => {
  try {
    const reservations = await showReservations()
    res.json(reservations)
  } catch (error) {
    console.error(error)
    res.status(500).json({ message: "Error al recuperar las reservaciones" })
  }
}

const createNewReservation = async (req, res) => {
  const {
    nombre,
    telefono,
    correo = null,
    mesa_id,
    fecha,
    hora,
    personas,
    notas = null
  } = req.body

  if (!nombre || !telefono || !mesa_id || !fecha || !hora || !personas) {
    return res.status(400).json({ message: "Los campos nombre, telefono, mesa, fecha, hora y personas son obligatorios" })
  }

  try {
    const clienteId = await createCustomer(nombre, telefono, correo)
    await createReservation(clienteId, mesa_id, fecha, hora, personas, "pendiente", notas)
    res.status(201).json({ message: "Reservacion creada correctamente" })
  } catch (error) {
    console.error(error)
    res.status(500).json({ message: "Error al crear la reservacion" })
  }
}

const updateExistingReservation = async (req, res) => {
  const { id } = req.params
  const {
    mesa_id,
    fecha,
    hora,
    personas,
    estado,
    notas
  } = req.body

  if (!mesa_id || !fecha || !hora || !personas || !estado) {
    return res.status(400).json({ message: "Los campos mesa, fecha, hora, personas y estado son obligatorios" })
  }

  try {
    const existingReservation = await findReservationById(id)
    if (!existingReservation) {
      return res.status(404).json({ message: "Reservacion no encontrada" })
    }

    await updateReservation(id, mesa_id, fecha, hora, personas, estado, notas)
    res.json({ message: "Reservacion actualizada correctamente" })
  } catch (error) {
    console.error(error)
    res.status(500).json({ message: "Error al actualizar la reservacion" })
  }
}

const deleteExistingReservation = async (req, res) => {
  const { id } = req.params

  try {
    const existingReservation = await findReservationById(id)
    if (!existingReservation) {
      return res.status(404).json({ message: "Reservacion no encontrada" })
    }

    await deleteReservation(id)
    res.json({ message: "Reservacion eliminada correctamente" })
  } catch (error) {
    console.error(error)
    res.status(500).json({ message: "Error al eliminar la reservacion" })
  }
}

module.exports = {
  getReservations,
  createNewReservation,
  updateExistingReservation,
  deleteExistingReservation
}
