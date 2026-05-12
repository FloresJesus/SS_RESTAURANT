const { Router } = require("express")
const { getConfig, updateConfig } = require("../controllers/settingsController")

const router = Router()

router.get("/", getConfig)
router.put("/", updateConfig)

module.exports = router
