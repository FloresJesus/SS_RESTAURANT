const express = require("express")
const router = express.Router()
const {
  getAllOrders,
  createNewOrder,
  updateExistingOrderStatus,
  getSalesStats
} = require("../controllers/orderController")
const { checkRole } = require("../middleware/roleMiddleware")

router.get("/", getAllOrders)
router.get("/stats", getSalesStats)
router.post("/", checkRole(["admin", "camarero"]), createNewOrder)
router.put("/:id/status", updateExistingOrderStatus)

module.exports = router
