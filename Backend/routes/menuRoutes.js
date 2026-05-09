const express = require("express")
const router = express.Router()
const {
  getMenu,
  getCategoriesList,
  createNewCategory,
  createNewMenuItem,
  updateExistingMenuItem,
  deleteMenuItemById,
  uploadImage,
  upload
} = require("../controllers/menuController")
const { checkRole } = require("../middleware/roleMiddleware")

router.get("/", getMenu)
router.get("/categorias", getCategoriesList)
router.post("/categorias", checkRole(["admin"]), createNewCategory)
router.post("/", checkRole(["admin"]), createNewMenuItem)
router.put("/:id", checkRole(["admin"]), updateExistingMenuItem)
router.delete("/:id", checkRole(["admin"]), deleteMenuItemById)
router.post("/upload", checkRole(["admin"]), upload.single("image"), uploadImage)

module.exports = router
