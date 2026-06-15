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
  deleteExistingReservation,
  convertReservationToOrder
} = require("../controllers/reservationController")
const { checkRole } = require("../middleware/roleMiddleware")

router.get("/", getReservations)
router.get("/pendientes", getPendingReservationsList)
router.get("/mesas-disponibles", getAvailableTables)
router.get("/:id", getReservationById)
router.post("/", createNewReservation)
router.put("/:id", updateExistingReservation)
router.patch("/:id/estado", updateReservationState)
router.post("/:id/convertir-pedido", checkRole(["admin", "mesero", "cajero"]), convertReservationToOrder)
router.delete("/:id", deleteExistingReservation)

module.exports = router
