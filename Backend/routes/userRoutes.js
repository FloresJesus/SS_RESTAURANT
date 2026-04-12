const express = require("express")
const router = express.Router()

const { getUsers } = require("../controllers/userController")
const { createUser } = require("../models/userModels")

router.get("/", getUsers)
router.post("/", createUser)

module.exports = router