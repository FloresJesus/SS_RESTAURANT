const { logAudit } = require("../utils/auditLogger")
const {
  showReservations,
  findReservationById,
  findReservationByClientId,
  createReservation,
  updateReservation,
  updateReservationStatus,
  deleteReservation,
  getReservationsByDate,
  getAvailableTablesForReservation,
  getPendingReservations
} = require("../models/reservationModels")

const getReservations = async (req, res) => {
  const { fecha } = req.query

  try {
    let reservations
    if (fecha) {
      reservations = await getReservationsByDate(fecha)
    } else {
      reservations = await showReservations()
    }
    res.json(reservations)
  } catch (error) {
    console.error("Error al recuperar las reservaciones:", error)
    res.status(500).json({ message: "Error al recuperar las reservaciones" })
  }
}

const getReservationById = async (req, res) => {
  const { id } = req.params

  try {
    const reservation = await findReservationById(id)
    if (!reservation) {
      return res.status(404).json({ message: "Reservacion no encontrada" })
    }
    res.json(reservation)
  } catch (error) {
    console.error("Error al recuperar la reservacion:", error)
    res.status(500).json({ message: "Error al recuperar la reservacion" })
  }
}

const getPendingReservationsList = async (req, res) => {
  try {
    const reservations = await getPendingReservations()
    res.json(reservations)
  } catch (error) {
    console.error("Error al recuperar reservaciones pendientes:", error)
    res.status(500).json({ message: "Error al recuperar reservaciones pendientes" })
  }
}

const getAvailableTables = async (req, res) => {
  const { fecha_reserva, hora_reserva, cantidad_personas } = req.query

  if (!fecha_reserva || !cantidad_personas) {
    return res.status(400).json({ message: "Fecha y cantidad de personas son obligatorios" })
  }

  try {
    const tables = await getAvailableTablesForReservation(
      fecha_reserva,
      hora_reserva || '19:00',
      Number(cantidad_personas)
    )
    res.json(tables)
  } catch (error) {
    console.error("Error al recuperar mesas disponibles:", error)
    res.status(500).json({ message: "Error al recuperar mesas disponibles" })
  }
}

const createNewReservation = async (req, res) => {
  const {
    cliente_id,
    mesa_id,
    cantidad_personas,
    fecha_reserva,
    hora_reserva,
    observaciones = null
  } = req.body

  if (!mesa_id || !fecha_reserva || !hora_reserva || !cantidad_personas) {
    return res.status(400).json({
      message: "Mesa, fecha, hora y cantidad de personas son obligatorios"
    })
  }

  try {
    const result = await createReservation(
      cliente_id || null,
      mesa_id,
      Number(cantidad_personas),
      fecha_reserva,
      hora_reserva,
      'pendiente',
      observaciones
    )
    await logAudit(req.user.id, 'CREAR', 'reservaciones', result.insertId, `Reservacion ${result.insertId} creada`, req.ip)
    res.status(201).json({
      message: "Reservacion creada correctamente",
      id: result.insertId
    })
  } catch (error) {
    console.error("Error al crear la reservacion:", error)
    res.status(500).json({ message: "Error al crear la reservacion" })
  }
}

const updateExistingReservation = async (req, res) => {
  const { id } = req.params
  const {
    mesa_id,
    cantidad_personas,
    fecha_reserva,
    hora_reserva,
    estado,
    observaciones = null
  } = req.body

  if (!mesa_id || !fecha_reserva || !hora_reserva || !cantidad_personas || !estado) {
    return res.status(400).json({
      message: "Todos los campos son obligatorios"
    })
  }

  const validStates = ['pendiente', 'confirmada', 'cancelada', 'completada', 'no_asistio']
  if (!validStates.includes(estado)) {
    return res.status(400).json({ message: `Estado invalido. Estados validos: ${validStates.join(', ')}` })
  }

  try {
    const existingReservation = await findReservationById(id)
    if (!existingReservation) {
      return res.status(404).json({ message: "Reservacion no encontrada" })
    }

    await updateReservation(
      id,
      mesa_id,
      Number(cantidad_personas),
      fecha_reserva,
      hora_reserva,
      estado,
      observaciones
    )
    await logAudit(req.user.id, 'ACTUALIZAR', 'reservaciones', Number(id), `Reservacion ${id} actualizada`, req.ip)
    res.json({ message: "Reservacion actualizada correctamente" })
  } catch (error) {
    console.error("Error al actualizar la reservacion:", error)
    res.status(500).json({ message: "Error al actualizar la reservacion" })
  }
}

const updateReservationState = async (req, res) => {
  const { id } = req.params
  const { estado } = req.body

  if (!estado) {
    return res.status(400).json({ message: "Estado es obligatorio" })
  }

  const validStates = ['pendiente', 'confirmada', 'cancelada', 'completada', 'no_asistio']
  if (!validStates.includes(estado)) {
    return res.status(400).json({ message: `Estado invalido. Estados validos: ${validStates.join(', ')}` })
  }

  try {
    const existingReservation = await findReservationById(id)
    if (!existingReservation) {
      return res.status(404).json({ message: "Reservacion no encontrada" })
    }

    await updateReservationStatus(id, estado)
    await logAudit(req.user.id, 'ACTUALIZAR', 'reservaciones', Number(id), `Estado reservacion ${id} cambiado a ${estado}`, req.ip)
    res.json({ message: "Estado de reservacion actualizado correctamente" })
  } catch (error) {
    console.error("Error al actualizar estado de la reservacion:", error)
    res.status(500).json({ message: "Error al actualizar estado de la reservacion" })
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
    await logAudit(req.user.id, 'ELIMINAR', 'reservaciones', Number(id), `Reservacion ${id} eliminada`, req.ip)
    res.json({ message: "Reservacion eliminada correctamente" })
  } catch (error) {
    console.error("Error al eliminar la reservacion:", error)
    res.status(500).json({ message: "Error al eliminar la reservacion" })
  }
}

module.exports = {
  getReservations,
  getReservationById,
  getPendingReservationsList,
  getAvailableTables,
  createNewReservation,
  updateExistingReservation,
  updateReservationState,
  deleteExistingReservation
}
