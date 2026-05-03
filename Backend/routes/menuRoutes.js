const express = require("express")
const multer = require("multer")
const path = require("path")
const router = express.Router()

const {
  getMenu,
  createNewMenuItem,
  updateExistingMenuItem,
  deleteMenuItemById,
  uploadImage
} = require("../controllers/menuController")
const { checkRole } = require("../middleware/roleMiddleware")

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, "..", "uploads", "menu"))
  },
  filename: (req, file, cb) => {
    const timestamp = Date.now()
    const sanitized = file.originalname.replace(/[^a-zA-Z0-9.-]/g, "_")
    cb(null, `${timestamp}_${sanitized}`)
  }
})

const upload = multer({
  storage,
  fileFilter: (req, file, cb) => {
    if (!file.mimetype.startsWith("image/")) {
      return cb(new Error("Solo se permiten imagenes"), false)
    }
    cb(null, true)
  },
  limits: {
    fileSize: 3 * 1024 * 1024
  }
})

router.get("/", getMenu)
router.post("/", checkRole(["admin"]), createNewMenuItem)
router.put("/:id", checkRole(["admin"]), updateExistingMenuItem)
router.delete("/:id", checkRole(["admin"]), deleteMenuItemById)
router.post("/upload", checkRole(["admin"]), upload.single("image"), uploadImage)

module.exports = router
