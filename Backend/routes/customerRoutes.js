const express = require("express")
const router = express.Router()

const {
  getCustomers,
  createNewCustomer,
  updateExistingCustomer,
  deleteExistingCustomer
} = require("../controllers/customerController")

router.get("/", getCustomers)
router.post("/", createNewCustomer)
router.put("/:id", updateExistingCustomer)
router.delete("/:id", deleteExistingCustomer)

module.exports = router