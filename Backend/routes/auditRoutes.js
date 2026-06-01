const express = require("express")
const router = express.Router()
const { getAudit, logAuditEntry } = require("../controllers/auditController")

router.get("/", getAudit)
router.post("/", logAuditEntry)

module.exports = router
