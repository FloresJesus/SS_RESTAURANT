const express = require("express")
const router = express.Router()
const {
  getAllOrders,
  getOrderById,
  createNewOrder,
  updateOrderItems,
  deleteOrderItem,
  updateOrderStatus,
  getSalesStats
} = require("../controllers/orderController")
const { checkRole } = require("../middleware/roleMiddleware")

router.get("/", getAllOrders)
router.get("/stats", getSalesStats)
router.get("/:id", getOrderById)
router.post("/", checkRole(["admin", "mesero", "cajero"]), createNewOrder)
router.put("/:id/items", checkRole(["admin", "mesero"]), updateOrderItems)
router.put("/:id/status", updateOrderStatus)
router.delete("/:id/items/:itemId", checkRole(["admin", "mesero"]), deleteOrderItem)

module.exports = router
