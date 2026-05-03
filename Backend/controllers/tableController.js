const { showTables, createTable } = require("../models/tableModels")

const getTables = async (req, res) => {
  try {
    const tables = await showTables()
    res.json(tables)
  } catch (error) {
    console.error(error)
    res.status(500).json({ message: "Error al recuperar las mesas" })
  }
}

const createNewTable = async (req, res) => {
  const { nombre, capacidad, ubicacion = null, activa = true } = req.body

  if (!nombre || capacidad == null) {
    return res.status(400).json({ message: "Nombre y capacidad son obligatorios" })
  }

  try {
    await createTable(nombre, Number(capacidad), ubicacion, activa)
    res.status(201).json({ message: "Mesa creada correctamente" })
  } catch (error) {
    console.error(error)
    res.status(500).json({ message: "Error al crear la mesa" })
  }
}

module.exports = {
  getTables,
  createNewTable
}
