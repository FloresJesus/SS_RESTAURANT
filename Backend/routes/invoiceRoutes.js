const express = require("express")
const router = express.Router()
const {
  getAllInvoices,
  getInvoiceById,
  getInvoiceByOrderId,
  getInvoiceByNumero,
  generateInvoice,
  getTodayInvoicesList,
  getInvoicesSummaryToday
} = require("../controllers/invoiceController")
const { checkRole } = require("../middleware/roleMiddleware")

router.get("/", getAllInvoices)
router.get("/hoy", getTodayInvoicesList)
router.get("/resumen", getInvoicesSummaryToday)
router.get("/pedido/:pedido_id", getInvoiceByOrderId)
router.get("/numero/:numero", getInvoiceByNumero)
router.get("/:id", getInvoiceById)
router.post("/", checkRole(["admin", "cajero"]), generateInvoice)

module.exports = router
