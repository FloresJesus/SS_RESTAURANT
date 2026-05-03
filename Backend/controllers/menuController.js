const {
  getMenuItems,
  findMenuItemById,
  createMenuItem,
  updateMenuItem,
  deleteMenuItem
} = require("../models/menuModels")

const getMenu = async (req, res) => {
  try {
    const items = await getMenuItems()
    const baseUrl = `${req.protocol}://${req.get("host")}`
    const mapped = items.map((item) => ({
      ...item,
      imagen: item.imagen ? `${baseUrl}${item.imagen}` : null
    }))
    res.json(mapped)
  } catch (error) {
    console.error(error)
    res.status(500).json({ message: "Error al recuperar el menu" })
  }
}

const createNewMenuItem = async (req, res) => {
  const {
    categoria,
    nombre,
    descripcion,
    precio,
    disponible = true,
    tiempo_cocina_min = 15,
    nota_alergenos = null,
    imagen = null
  } = req.body

  if (!categoria || !nombre || precio == null) {
    return res.status(400).json({ message: "Categoria, nombre y precio son obligatorios" })
  }

  try {
    const parsedPrecio = Number(precio)
    const parsedDisponible = disponible === "false" ? false : Boolean(disponible)
    const parsedTiempo = Number(tiempo_cocina_min) || 15

    await createMenuItem(
      categoria,
      nombre,
      descripcion,
      parsedPrecio,
      parsedDisponible,
      parsedTiempo,
      nota_alergenos,
      imagen
    )

    res.status(201).json({ message: "Platillo creado correctamente" })
  } catch (error) {
    console.error(error)
    res.status(500).json({ message: "Error al crear el platillo" })
  }
}

const updateExistingMenuItem = async (req, res) => {
  const { id } = req.params
  const {
    categoria,
    nombre,
    descripcion,
    precio,
    disponible = true,
    tiempo_cocina_min = 15,
    nota_alergenos = null,
    imagen = null
  } = req.body

  if (!categoria || !nombre || precio == null) {
    return res.status(400).json({ message: "Categoria, nombre y precio son obligatorios" })
  }

  try {
    const current = await findMenuItemById(id)
    if (!current) {
      return res.status(404).json({ message: "Platillo no encontrado" })
    }

    const parsedPrecio = Number(precio)
    const parsedDisponible = disponible === "false" ? false : Boolean(disponible)
    const parsedTiempo = Number(tiempo_cocina_min) || 15

    await updateMenuItem(
      id,
      categoria,
      nombre,
      descripcion,
      parsedPrecio,
      parsedDisponible,
      parsedTiempo,
      nota_alergenos,
      imagen || current.imagen
    )

    res.json({ message: "Platillo actualizado correctamente" })
  } catch (error) {
    console.error(error)
    res.status(500).json({ message: "Error al actualizar el platillo" })
  }
}

const deleteMenuItemById = async (req, res) => {
  const { id } = req.params

  try {
    const current = await findMenuItemById(id)
    if (!current) {
      return res.status(404).json({ message: "Platillo no encontrado" })
    }

    await deleteMenuItem(id)
    res.json({ message: "Platillo eliminado correctamente" })
  } catch (error) {
    console.error(error)
    res.status(500).json({ message: "Error al eliminar el platillo" })
  }
}

const uploadImage = async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ message: "No se recibio ningun archivo" })
  }

  const imagePath = `/uploads/menu/${req.file.filename}`
  const imageUrl = `${req.protocol}://${req.get("host")}${imagePath}`
  res.status(201).json({ imageUrl, path: imagePath })
}

module.exports = {
  getMenu,
  createNewMenuItem,
  updateExistingMenuItem,
  deleteMenuItemById,
  uploadImage
}
