const express = require("express")
const router = express.Router()
const { getTables, getTableById, createNewTable, updateExistingTable, updateTableState, deleteTableById, getAvailableTablesList } = require("../controllers/tableController")

router.get("/", getTables)
router.get("/disponibles", getAvailableTablesList)
router.get("/:id", getTableById)
router.post("/", createNewTable)
router.put("/:id", updateExistingTable)
router.patch("/:id/estado", updateTableState)
router.delete("/:id", deleteTableById)

module.exports = router
