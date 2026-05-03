const express = require("express")
const router = express.Router()
const { getTables, createNewTable } = require("../controllers/tableController")

router.get("/", getTables)
router.post("/", createNewTable)

module.exports = router
