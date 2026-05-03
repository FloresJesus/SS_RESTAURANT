const express = require("express")
const router = express.Router()
const {
  getAllOrders,
  createNewOrder,
  updateExistingOrderStatus
} = require("../controllers/orderController")

router.get("/", getAllOrders)
router.post("/", createNewOrder)
router.put("/:id/status", updateExistingOrderStatus)

module.exports = router
