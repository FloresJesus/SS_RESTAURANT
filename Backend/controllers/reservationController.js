const db = require("../config/db")
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
  getPendingReservations,
  findReservationsByTableAndDate,
  markExpiredNoShow,
  checkTableAvailability
} = require("../models/reservationModels")
const { updateTableStatus, findTableById } = require("../models/tableModels")

const getReservations = async (req, res) => {
  const { fecha } = req.query

  try {
    await markExpiredNoShow()
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
  const { fecha_hora_inicio, fecha_hora_fin, cantidad_personas } = req.query

  if (!fecha_hora_inicio || !fecha_hora_fin || !cantidad_personas) {
    return res.status(400).json({ message: "fecha_hora_inicio, fecha_hora_fin y cantidad_personas son obligatorios" })
  }

  try {
    const tables = await getAvailableTablesForReservation(
      fecha_hora_inicio,
      fecha_hora_fin,
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
    fecha_hora_inicio,
    fecha_hora_fin,
    observaciones = null
  } = req.body

  if (!mesa_id || !fecha_hora_inicio || !fecha_hora_fin || !cantidad_personas) {
    return res.status(400).json({
      message: "Mesa, fecha_hora_inicio, fecha_hora_fin y cantidad de personas son obligatorios"
    })
  }

  try {
    const disponible = await checkTableAvailability(mesa_id, fecha_hora_inicio, fecha_hora_fin)
    if (!disponible) {
      return res.status(409).json({ message: "La mesa ya esta reservada en ese horario" })
    }

    const result = await createReservation(
      cliente_id || null,
      mesa_id,
      Number(cantidad_personas),
      fecha_hora_inicio,
      fecha_hora_fin,
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
    fecha_hora_inicio,
    fecha_hora_fin,
    estado,
    observaciones = null
  } = req.body

  if (!mesa_id || !fecha_hora_inicio || !fecha_hora_fin || !cantidad_personas || !estado) {
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

    const disponible = await checkTableAvailability(mesa_id, fecha_hora_inicio, fecha_hora_fin, Number(id))
    if (!disponible) {
      return res.status(409).json({ message: "La mesa ya esta reservada en ese horario" })
    }

    await updateReservation(
      id,
      mesa_id,
      Number(cantidad_personas),
      fecha_hora_inicio,
      fecha_hora_fin,
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

    const mesaId = existingReservation.mesa_id

    if (estado === 'cancelada' || estado === 'no_asistio') {
      const [activeOrders] = await db.query(
        `SELECT COUNT(*) AS count FROM pedido
         WHERE mesa_id = ? AND estado_servicio IN ('pendiente', 'preparando', 'listo')`,
        [mesaId]
      )
      if (Number(activeOrders[0].count) === 0) {
        await updateTableStatus(mesaId, 'libre')
      }
    }

    await logAudit(req.user.id, 'ACTUALIZAR', 'reservaciones', Number(id), `Estado reservacion ${id} cambiado a ${estado}`, req.ip)
    res.json({ message: "Estado de reservacion actualizado correctamente" })
  } catch (error) {
    console.error("Error al actualizar estado de la reservacion:", error)
    res.status(500).json({ message: "Error al actualizar estado de la reservacion" })
  }
}

const convertReservationToOrder = async (req, res) => {
  const { id } = req.params
  const { mesero_id, items = [], observaciones = null, metodo_pago = null } = req.body

  if (!mesero_id) {
    return res.status(400).json({ message: "Mesero es obligatorio" })
  }

  if (!items || items.length === 0) {
    return res.status(400).json({ message: "Al menos un producto es obligatorio" })
  }

  const connection = await db.getConnection()

  try {
    await connection.beginTransaction()

    const [reservationRows] = await connection.query(
      `SELECT id, cliente_id, mesa_id, cantidad_personas, estado FROM reserva WHERE id = ?`,
      [id]
    )
    if (!reservationRows[0]) {
      throw new Error("Reservacion no encontrada")
    }
    if (reservationRows[0].estado !== 'confirmada' && reservationRows[0].estado !== 'pendiente') {
      throw new Error("La reservacion debe estar confirmada o pendiente para crear un pedido")
    }

    const reservation = reservationRows[0]

    const [tableData] = await connection.query(
      `SELECT id, estado FROM mesa WHERE id = ?`,
      [reservation.mesa_id]
    )
    if (!tableData[0]) {
      throw new Error("Mesa no encontrada")
    }

    const [orderResult] = await connection.query(
      `INSERT INTO pedido (cliente_id, reserva_id, mesa_id, mesero_id, observaciones)
       VALUES (?, ?, ?, ?, ?)`,
      [reservation.cliente_id, reservation.id, reservation.mesa_id, mesero_id, observaciones]
    )
    const orderId = orderResult.insertId

    let total = 0
    for (const item of items) {
      if (!item.producto_id || !item.cantidad) continue

      const [productData] = await connection.query(
        `SELECT precio FROM producto WHERE id = ?`,
        [item.producto_id]
      )
      if (!productData[0]) continue

      const precioUnitario = item.precio_unitario || productData[0].precio
      const subtotal = item.cantidad * precioUnitario
      total += subtotal

      await connection.query(
        `INSERT INTO detalle_pedido (pedido_id, producto_id, cantidad, precio_unitario, subtotal, observaciones)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [orderId, item.producto_id, item.cantidad, precioUnitario, subtotal, item.observaciones || null]
      )
    }

    if (metodo_pago) {
      const validMethods = ['efectivo', 'tarjeta', 'qr', 'transferencia']
      if (!validMethods.includes(metodo_pago)) {
        throw new Error('Metodo de pago invalido')
      }
      await connection.query(
        `INSERT INTO pago (pedido_id, metodo, monto) VALUES (?, ?, ?)`,
        [orderId, metodo_pago, total]
      )
      await connection.query(
        `UPDATE pedido SET estado_pago = 'pagado' WHERE id = ?`,
        [orderId]
      )
    }

    await connection.query(
      `UPDATE reserva SET estado = 'completada' WHERE id = ?`,
      [id]
    )

    await connection.query(
      `UPDATE mesa SET estado = 'ocupada' WHERE id = ?`,
      [reservation.mesa_id]
    )

    await connection.commit()

    await logAudit(req.user.id, 'CREAR', 'pedidos', orderId, `Pedido ${orderId} creado desde reserva ${id}`, req.ip)
    res.status(201).json({
      id: orderId,
      message: "Pedido creado correctamente desde la reservacion"
    })
  } catch (error) {
    await connection.rollback()
    console.error("Error al convertir reservacion a pedido:", error)
    res.status(400).json({ message: error.message || "Error al crear el pedido desde la reservacion" })
  } finally {
    connection.release()
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
  deleteExistingReservation,
  convertReservationToOrder
}
