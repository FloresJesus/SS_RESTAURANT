const express = require("express")
const router = express.Router()
const { getAvailableProducts } = require("../models/menuModels")
const db = require("../config/db")

router.get("/", async (req, res) => {
  try {
    const products = await getAvailableProducts()
    const [categories] = await db.query(
      `SELECT id, nombre FROM categoria_producto ORDER BY nombre`
    )
    res.json({ products, categories })
  } catch (error) {
    console.error("Error fetching public menu:", error)
    res.status(500).json({ message: "Error al obtener el menu" })
  }
})

module.exports = router
