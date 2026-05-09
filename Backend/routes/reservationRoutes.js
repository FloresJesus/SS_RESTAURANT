const express = require("express")
const router = express.Router()
const {
  getReservations,
  getReservationById,
  getPendingReservationsList,
  getAvailableTables,
  createNewReservation,
  updateExistingReservation,
  updateReservationState,
  deleteExistingReservation
} = require("../controllers/reservationController")

router.get("/", getReservations)
router.get("/pendientes", getPendingReservationsList)
router.get("/mesas-disponibles", getAvailableTables)
router.get("/:id", getReservationById)
router.post("/", createNewReservation)
router.put("/:id", updateExistingReservation)
router.patch("/:id/estado", updateReservationState)
router.delete("/:id", deleteExistingReservation)

module.exports = router
