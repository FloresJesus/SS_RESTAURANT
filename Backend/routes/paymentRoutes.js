const express = require("express")
const router = express.Router()
const { processPayment, getPaymentsList, getPaymentById, getDailySummary } = require("../controllers/paymentController")
const { checkRole } = require("../middleware/roleMiddleware")

router.get("/", getPaymentsList)
router.get("/resumen-diario", getDailySummary)
router.get("/:id", getPaymentById)
router.post("/", checkRole(["admin", "cajero"]), processPayment)

module.exports = router
