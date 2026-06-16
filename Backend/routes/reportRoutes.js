const express = require("express")
const router = express.Router()
const {
  generateReport,
  getReportsList,
  getReportById,
  downloadReport,
  deleteReport,
  getTipos
} = require("../controllers/reportController")

router.get("/tipos", getTipos)
router.get("/", getReportsList)
router.get("/:id", getReportById)
router.post("/generate/:tipo", generateReport)
router.get("/download/:id", downloadReport)
router.delete("/:id", deleteReport)

module.exports = router
