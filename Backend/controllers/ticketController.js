const {
  getTickets,
  findTicketById,
  findTicketByOrderId,
  findTicketByNumero,
  createTicket,
  getTicketWithDetails,
  getTicketsByDate,
  getTodayTickets
} = require("../models/ticketModels")

const getAllTickets = async (req, res) => {
  const { fecha } = req.query

  try {
    let tickets
    if (fecha) {
      tickets = await getTicketsByDate(fecha)
    } else {
      tickets = await getTickets()
    }
    res.json(tickets)
  } catch (error) {
    console.error("Error al recuperar tickets:", error)
    res.status(500).json({ message: "Error al recuperar tickets" })
  }
}

const getTicketById = async (req, res) => {
  const { id } = req.params

  try {
    const ticket = await getTicketWithDetails(id)
    if (!ticket) {
      return res.status(404).json({ message: "Ticket no encontrado" })
    }
    res.json(ticket)
  } catch (error) {
    console.error("Error al recuperar el ticket:", error)
    res.status(500).json({ message: "Error al recuperar el ticket" })
  }
}

const getTicketByOrderId = async (req, res) => {
  const { pedido_id } = req.params

  try {
    const ticket = await findTicketByOrderId(pedido_id)
    if (!ticket) {
      return res.status(404).json({ message: "Ticket no encontrado para este pedido" })
    }
    const ticketWithDetails = await getTicketWithDetails(ticket.id)
    res.json(ticketWithDetails)
  } catch (error) {
    console.error("Error al recuperar el ticket:", error)
    res.status(500).json({ message: "Error al recuperar el ticket" })
  }
}

const getTicketByNumero = async (req, res) => {
  const { numero } = req.params

  try {
    const ticket = await findTicketByNumero(numero)
    if (!ticket) {
      return res.status(404).json({ message: "Ticket no encontrado" })
    }
    const ticketWithDetails = await getTicketWithDetails(ticket.id)
    res.json(ticketWithDetails)
  } catch (error) {
    console.error("Error al recuperar el ticket:", error)
    res.status(500).json({ message: "Error al recuperar el ticket" })
  }
}

const generateTicket = async (req, res) => {
  const { pedido_id } = req.body

  if (!pedido_id) {
    return res.status(400).json({ message: "pedido_id es obligatorio" })
  }

  try {
    const existingTicket = await findTicketByOrderId(pedido_id)
    if (existingTicket) {
      return res.status(400).json({
        message: "Este pedido ya tiene un ticket asociado",
        ticket: existingTicket
      })
    }

    const ticket = await createTicket(pedido_id)
    res.status(201).json({
      message: "Ticket generado correctamente",
      ticket
    })
  } catch (error) {
    console.error("Error al generar el ticket:", error)
    res.status(500).json({ message: error.message || "Error al generar el ticket" })
  }
}

const getTodayTicketsList = async (req, res) => {
  try {
    const tickets = await getTodayTickets()
    res.json(tickets)
  } catch (error) {
    console.error("Error al recuperar tickets del dia:", error)
    res.status(500).json({ message: "Error al recuperar tickets del dia" })
  }
}

module.exports = {
  getAllTickets,
  getTicketById,
  getTicketByOrderId,
  getTicketByNumero,
  generateTicket,
  getTodayTicketsList
}
