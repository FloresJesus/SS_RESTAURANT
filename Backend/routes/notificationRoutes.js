const express = require("express")
const router = express.Router()
const { getAllNotifications, markNotificationAsRead, markAllNotificationsAsRead } = require("../controllers/notificationController")

router.get("/", getAllNotifications)
router.put("/:id/read", markNotificationAsRead)
router.put("/read-all", markAllNotificationsAsRead)

module.exports = router
