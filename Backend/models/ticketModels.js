const db = require("../config/db")

const getTickets = async () => {
  const [rows] = await db.query(
    `SELECT t.id, t.pedido_id, t.numero_diario, t.fecha, t.numero_ticket, t.creado_en,
            p.estado_servicio, p.estado_pago, m.numero AS mesa_numero,
            u.nombre AS mesero_nombre, u.apellido AS mesero_apellido
     FROM ticket t
     JOIN pedido p ON t.pedido_id = p.id
     LEFT JOIN mesa m ON p.mesa_id = m.id
     LEFT JOIN usuario u ON p.mesero_id = u.id
     ORDER BY t.fecha DESC, t.numero_diario DESC`
  )
  return rows
}

const findTicketById = async (id) => {
  const [rows] = await db.query(
    `SELECT t.id, t.pedido_id, t.numero_diario, t.fecha, t.numero_ticket, t.creado_en,
            p.estado_servicio, p.estado_pago, m.numero AS mesa_numero,
            u.nombre AS mesero_nombre, u.apellido AS mesero_apellido
     FROM ticket t
     JOIN pedido p ON t.pedido_id = p.id
     LEFT JOIN mesa m ON p.mesa_id = m.id
     LEFT JOIN usuario u ON p.mesero_id = u.id
     WHERE t.id = ?`,
    [id]
  )
  return rows[0]
}

const findTicketByOrderId = async (pedido_id) => {
  const [rows] = await db.query(
    `SELECT t.id, t.pedido_id, t.numero_diario, t.fecha, t.numero_ticket, t.creado_en
     FROM ticket t
     WHERE t.pedido_id = ?`,
    [pedido_id]
  )
  return rows[0]
}

const findTicketByNumero = async (numero_ticket) => {
  const [rows] = await db.query(
    `SELECT t.id, t.pedido_id, t.numero_diario, t.fecha, t.numero_ticket, t.creado_en,
            p.estado_servicio, p.estado_pago, m.numero AS mesa_numero,
            u.nombre AS mesero_nombre, u.apellido AS mesero_apellido
     FROM ticket t
     JOIN pedido p ON t.pedido_id = p.id
     LEFT JOIN mesa m ON p.mesa_id = m.id
     LEFT JOIN usuario u ON p.mesero_id = u.id
     WHERE t.numero_ticket = ?`,
    [numero_ticket]
  )
  return rows[0]
}

const getNextDailyNumber = async (fecha) => {
  const [rows] = await db.query(
    `SELECT COALESCE(MAX(numero_diario), 0) + 1 AS siguiente_numero
     FROM ticket
     WHERE fecha = ?`,
    [fecha]
  )
  return rows[0].siguiente_numero
}

const createTicket = async (pedido_id) => {
  const connection = await db.getConnection()
  
  try {
    await connection.beginTransaction()
    
    const existingTicket = await connection.query(
      `SELECT id FROM ticket WHERE pedido_id = ?`,
      [pedido_id]
    )
    if (existingTicket[0].length > 0) {
      throw new Error('Este pedido ya tiene un ticket asociado')
    }
    
    const [orderData] = await connection.query(
      `SELECT m.numero AS mesa_numero, u.nombre AS mesero_nombre
       FROM pedido p
       LEFT JOIN mesa m ON p.mesa_id = m.id
       LEFT JOIN usuario u ON p.mesero_id = u.id
       WHERE p.id = ?`,
      [pedido_id]
    )
    
    if (!orderData[0]) {
      throw new Error('Pedido no encontrado')
    }
    
    const today = new Date().toISOString().split('T')[0]
    const nextNumber = await getNextDailyNumber(today)
    const numeroTicket = `${today.replace(/-/g, '')}-${String(nextNumber).padStart(4, '0')}`
    
    const [result] = await connection.query(
      `INSERT INTO ticket (pedido_id, numero_diario, fecha, numero_ticket)
       VALUES (?, ?, ?, ?)`,
      [pedido_id, nextNumber, today, numeroTicket]
    )
    
    await connection.commit()
    
    return {
      id: result.insertId,
      pedido_id,
      numero_diario: nextNumber,
      fecha: today,
      numero_ticket: numeroTicket,
      mesa_numero: orderData[0].mesa_numero,
      mesero_nombre: orderData[0].mesero_nombre
    }
  } catch (error) {
    await connection.rollback()
    throw error
  } finally {
    connection.release()
  }
}

const getTicketWithDetails = async (id) => {
  const ticket = await findTicketById(id)
  if (!ticket) return null
  
  const [details] = await db.query(
    `SELECT dp.cantidad, dp.precio_unitario, dp.subtotal, dp.estado,
            pr.nombre AS producto_nombre
     FROM detalle_pedido dp
     JOIN producto pr ON dp.producto_id = pr.id
     WHERE dp.pedido_id = ?`,
    [ticket.pedido_id]
  )
  
  return {
    ...ticket,
    detalles: details
  }
}

const getTicketsByDate = async (fecha) => {
  const [rows] = await db.query(
    `SELECT t.id, t.pedido_id, t.numero_diario, t.fecha, t.numero_ticket, t.creado_en,
            p.estado_servicio, p.estado_pago, m.numero AS mesa_numero,
            u.nombre AS mesero_nombre, u.apellido AS mesero_apellido
     FROM ticket t
     JOIN pedido p ON t.pedido_id = p.id
     LEFT JOIN mesa m ON p.mesa_id = m.id
     LEFT JOIN usuario u ON p.mesero_id = u.id
     WHERE t.fecha = ?
     ORDER BY t.numero_diario`,
    [fecha]
  )
  return rows
}

const getTodayTickets = async () => {
  const today = new Date().toISOString().split('T')[0]
  return getTicketsByDate(today)
}

module.exports = {
  getTickets,
  findTicketById,
  findTicketByOrderId,
  findTicketByNumero,
  getNextDailyNumber,
  createTicket,
  getTicketWithDetails,
  getTicketsByDate,
  getTodayTickets
}
