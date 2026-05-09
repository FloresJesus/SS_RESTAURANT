const express = require("express")
const router = express.Router()

const {
  getUsers,
  getUserById,
  createUser,
  updateUser,
  deleteUserById
} = require("../controllers/userController")
const { checkRole } = require("../middleware/roleMiddleware")

router.get("/", checkRole(["admin"]), getUsers)
router.get("/:id", checkRole(["admin"]), getUserById)
router.post("/", checkRole(["admin"]), createUser)
router.put("/:id", checkRole(["admin"]), updateUser)
router.delete("/:id", checkRole(["admin"]), deleteUserById)

module.exports = router
