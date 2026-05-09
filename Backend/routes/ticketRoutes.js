const express = require("express")
const router = express.Router()
const {
  getAllTickets,
  getTicketById,
  getTicketByOrderId,
  getTicketByNumero,
  generateTicket,
  getTodayTicketsList
} = require("../controllers/ticketController")
const { checkRole } = require("../middleware/roleMiddleware")

router.get("/", getAllTickets)
router.get("/hoy", getTodayTicketsList)
router.get("/pedido/:pedido_id", getTicketByOrderId)
router.get("/numero/:numero", getTicketByNumero)
router.get("/:id", getTicketById)
router.post("/", checkRole(["admin", "cajero"]), generateTicket)

module.exports = router
