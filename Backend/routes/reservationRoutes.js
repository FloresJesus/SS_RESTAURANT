const express = require("express")
const router = express.Router()
const {
  getReservations,
  createNewReservation,
  updateExistingReservation,
  deleteExistingReservation
} = require("../controllers/reservationController")

router.get("/", getReservations)
router.post("/", createNewReservation)
router.put("/:id", updateExistingReservation)
router.delete("/:id", deleteExistingReservation)

module.exports = router
