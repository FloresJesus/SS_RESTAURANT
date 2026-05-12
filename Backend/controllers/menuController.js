const multer = require("multer")
const imagekit = require("../config/imagekit")
const {
  getCategories,
  findCategoryById,
  findCategoryByName,
  createCategory,
  updateCategory,
  deleteCategory,
  getProducts,
  getAvailableProducts,
  findProductById,
  createProduct,
  updateProduct,
  deleteProduct,
  getProductsByCategory
} = require("../models/menuModels")

const upload = multer({
  storage: multer.memoryStorage(),
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

const getMenu = async (req, res) => {
  try {
    const items = await getProducts()
    res.json(items)
  } catch (error) {
    console.error("Error al recuperar el menu:", error)
    res.status(500).json({ message: "Error al recuperar el menu" })
  }
}

const getCategoriesList = async (req, res) => {
  try {
    const categories = await getCategories()
    res.json(categories)
  } catch (error) {
    console.error("Error al recuperar categorias:", error)
    res.status(500).json({ message: "Error al recuperar categorias" })
  }
}

const createNewCategory = async (req, res) => {
  const { nombre } = req.body

  if (!nombre) {
    return res.status(400).json({ message: "Nombre de categoria es obligatorio" })
  }

  try {
    const existingCategory = await findCategoryByName(nombre)
    if (existingCategory) {
      return res.status(400).json({ message: "La categoria ya existe" })
    }

    const result = await createCategory(nombre)
    res.status(201).json({
      message: "Categoria creada correctamente",
      id: result.insertId
    })
  } catch (error) {
    console.error("Error al crear categoria:", error)
    res.status(500).json({ message: "Error al crear categoria" })
  }
}

const createNewMenuItem = async (req, res) => {
  const { categoria_id, nombre, descripcion, precio, disponible = true, imagen_url = null } = req.body

  if (!nombre || precio == null) {
    return res.status(400).json({ message: "Nombre y precio son obligatorios" })
  }

  try {
    if (categoria_id) {
      const category = await findCategoryById(categoria_id)
      if (!category) {
        return res.status(400).json({ message: "Categoria no encontrada" })
      }
    }

    const result = await createProduct(
      categoria_id || null,
      nombre,
      descripcion || null,
      Number(precio),
      disponible,
      imagen_url
    )

    res.status(201).json({
      message: "Producto creado correctamente",
      id: result.insertId
    })
  } catch (error) {
    console.error("Error al crear el producto:", error)
    res.status(500).json({ message: "Error al crear el producto" })
  }
}

const updateExistingMenuItem = async (req, res) => {
  const { id } = req.params
  const { categoria_id, nombre, descripcion, precio, disponible, imagen_url } = req.body

  if (!nombre || precio == null) {
    return res.status(400).json({ message: "Nombre y precio son obligatorios" })
  }

  try {
    const current = await findProductById(id)
    if (!current) {
      return res.status(404).json({ message: "Producto no encontrado" })
    }

    if (categoria_id) {
      const category = await findCategoryById(categoria_id)
      if (!category) {
        return res.status(400).json({ message: "Categoria no encontrada" })
      }
    }

    await updateProduct(
      id,
      categoria_id || null,
      nombre,
      descripcion || null,
      Number(precio),
      disponible !== undefined ? disponible : current.disponible,
      imagen_url || current.imagen_url
    )

    res.json({ message: "Producto actualizado correctamente" })
  } catch (error) {
    console.error("Error al actualizar el producto:", error)
    res.status(500).json({ message: "Error al actualizar el producto" })
  }
}

const deleteMenuItemById = async (req, res) => {
  const { id } = req.params

  try {
    const current = await findProductById(id)
    if (!current) {
      return res.status(404).json({ message: "Producto no encontrado" })
    }

    await deleteProduct(id)
    res.json({ message: "Producto eliminado correctamente" })
  } catch (error) {
    console.error("Error al eliminar el producto:", error)
    res.status(500).json({ message: "Error al eliminar el producto" })
  }
}

const uploadImage = async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ message: "No se recibio ningun archivo" })
  }

  try {
    const result = await imagekit.upload({
      file: req.file.buffer,
      fileName: `${Date.now()}_${req.file.originalname.replace(/[^a-zA-Z0-9.-]/g, "_")}`,
      folder: "/RestauranteSS/menu",
      useUniqueFileName: false
    })

    res.status(201).json({
      imageUrl: result.url,
      path: result.url,
      fileId: result.fileId
    })
  } catch (error) {
    console.error("Error al subir imagen a ImageKit:", error)
    res.status(500).json({ message: "Error al subir la imagen" })
  }
}

module.exports = {
  getMenu,
  getCategoriesList,
  createNewCategory,
  createNewMenuItem,
  updateExistingMenuItem,
  deleteMenuItemById,
  uploadImage,
  upload
}
