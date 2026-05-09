const {
  showTables,
  findTableById,
  createTable,
  updateTable,
  updateTableStatus,
  deleteTable,
  getAvailableTables
} = require("../models/tableModels")

const getTables = async (req, res) => {
  try {
    const tables = await showTables()
    res.json(tables)
  } catch (error) {
    console.error("Error al recuperar las mesas:", error)
    res.status(500).json({ message: "Error al recuperar las mesas" })
  }
}

const getTableById = async (req, res) => {
  const { id } = req.params

  try {
    const table = await findTableById(id)
    if (!table) {
      return res.status(404).json({ message: "Mesa no encontrada" })
    }
    res.json(table)
  } catch (error) {
    console.error("Error al recuperar la mesa:", error)
    res.status(500).json({ message: "Error al recuperar la mesa" })
  }
}

const createNewTable = async (req, res) => {
  const { numero, capacidad } = req.body

  if (!numero || capacidad == null) {
    return res.status(400).json({ message: "Numero y capacidad son obligatorios" })
  }

  try {
    const result = await createTable(numero, Number(capacidad))
    res.status(201).json({
      message: "Mesa creada correctamente",
      id: result.insertId
    })
  } catch (error) {
    console.error("Error al crear la mesa:", error)
    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(400).json({ message: "El numero de mesa ya existe" })
    }
    res.status(500).json({ message: "Error al crear la mesa" })
  }
}

const updateExistingTable = async (req, res) => {
  const { id } = req.params
  const { numero, capacidad, estado } = req.body

  if (!numero || capacidad == null || !estado) {
    return res.status(400).json({ message: "Numero, capacidad y estado son obligatorios" })
  }

  const validStates = ['libre', 'ocupada', 'mantenimiento']
  if (!validStates.includes(estado)) {
    return res.status(400).json({ message: `Estado invalido. Estados validos: ${validStates.join(', ')}` })
  }

  try {
    const existingTable = await findTableById(id)
    if (!existingTable) {
      return res.status(404).json({ message: "Mesa no encontrada" })
    }

    const result = await updateTable(id, numero, Number(capacidad), estado)
    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "Mesa no encontrada" })
    }

    res.json({ message: "Mesa actualizada correctamente" })
  } catch (error) {
    console.error("Error al actualizar la mesa:", error)
    res.status(500).json({ message: "Error al actualizar la mesa" })
  }
}

const updateTableState = async (req, res) => {
  const { id } = req.params
  const { estado } = req.body

  if (!estado) {
    return res.status(400).json({ message: "Estado es obligatorio" })
  }

  const validStates = ['libre', 'ocupada', 'mantenimiento']
  if (!validStates.includes(estado)) {
    return res.status(400).json({ message: `Estado invalido. Estados validos: ${validStates.join(', ')}` })
  }

  try {
    const existingTable = await findTableById(id)
    if (!existingTable) {
      return res.status(404).json({ message: "Mesa no encontrada" })
    }

    const result = await updateTableStatus(id, estado)
    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "Mesa no encontrada" })
    }

    res.json({ message: "Estado de mesa actualizado correctamente" })
  } catch (error) {
    console.error("Error al actualizar estado de la mesa:", error)
    res.status(500).json({ message: "Error al actualizar estado de la mesa" })
  }
}

const deleteTableById = async (req, res) => {
  const { id } = req.params

  try {
    const existingTable = await findTableById(id)
    if (!existingTable) {
      return res.status(404).json({ message: "Mesa no encontrada" })
    }

    const result = await deleteTable(id)
    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "Mesa no encontrada" })
    }

    res.json({ message: "Mesa eliminada correctamente" })
  } catch (error) {
    console.error("Error al eliminar la mesa:", error)
    res.status(500).json({ message: "Error al eliminar la mesa" })
  }
}

const getAvailableTablesList = async (req, res) => {
  try {
    const tables = await getAvailableTables()
    res.json(tables)
  } catch (error) {
    console.error("Error al recuperar mesas disponibles:", error)
    res.status(500).json({ message: "Error al recuperar mesas disponibles" })
  }
}

module.exports = {
  getTables,
  getTableById,
  createNewTable,
  updateExistingTable,
  updateTableState,
  deleteTableById,
  getAvailableTablesList
}
