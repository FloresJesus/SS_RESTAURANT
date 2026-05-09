const db = require("../config/db")

const getCategories = async () => {
  const [rows] = await db.query(
    `SELECT id, nombre
     FROM categoria_producto
     ORDER BY nombre`
  )
  return rows
}

const findCategoryById = async (id) => {
  const [rows] = await db.query(
    `SELECT id, nombre FROM categoria_producto WHERE id = ?`,
    [id]
  )
  return rows[0]
}

const findCategoryByName = async (nombre) => {
  const [rows] = await db.query(
    `SELECT id, nombre FROM categoria_producto WHERE nombre = ?`,
    [nombre]
  )
  return rows[0]
}

const createCategory = async (nombre) => {
  const [result] = await db.query(
    `INSERT INTO categoria_producto (nombre) VALUES (?)`,
    [nombre]
  )
  return result
}

const updateCategory = async (id, nombre) => {
  const [result] = await db.query(
    `UPDATE categoria_producto SET nombre = ? WHERE id = ?`,
    [nombre, id]
  )
  return result
}

const deleteCategory = async (id) => {
  const [result] = await db.query(
    `DELETE FROM categoria_producto WHERE id = ?`,
    [id]
  )
  return result
}

const getProducts = async () => {
  const [rows] = await db.query(
    `SELECT p.id, p.categoria_id, p.nombre, p.descripcion, p.precio,
            p.imagen_url, p.disponible, p.creado_en,
            c.nombre AS categoria_nombre
     FROM producto p
     LEFT JOIN categoria_producto c ON p.categoria_id = c.id
     ORDER BY c.nombre, p.nombre`
  )
  return rows
}

const getAvailableProducts = async () => {
  const [rows] = await db.query(
    `SELECT p.id, p.categoria_id, p.nombre, p.descripcion, p.precio,
            p.imagen_url, p.disponible, p.creado_en,
            c.nombre AS categoria_nombre
     FROM producto p
     LEFT JOIN categoria_producto c ON p.categoria_id = c.id
     WHERE p.disponible = TRUE
     ORDER BY c.nombre, p.nombre`
  )
  return rows
}

const findProductById = async (id) => {
  const [rows] = await db.query(
    `SELECT p.id, p.categoria_id, p.nombre, p.descripcion, p.precio,
            p.imagen_url, p.disponible, p.creado_en,
            c.nombre AS categoria_nombre
     FROM producto p
     LEFT JOIN categoria_producto c ON p.categoria_id = c.id
     WHERE p.id = ?`,
    [id]
  )
  return rows[0]
}

const createProduct = async (categoria_id, nombre, descripcion, precio, disponible = true, imagen_url = null) => {
  const [result] = await db.query(
    `INSERT INTO producto (categoria_id, nombre, descripcion, precio, disponible, imagen_url)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [categoria_id, nombre, descripcion, precio, disponible, imagen_url]
  )
  return result
}

const updateProduct = async (id, categoria_id, nombre, descripcion, precio, disponible, imagen_url) => {
  const [result] = await db.query(
    `UPDATE producto
     SET categoria_id = ?, nombre = ?, descripcion = ?, precio = ?,
         disponible = ?, imagen_url = ?
     WHERE id = ?`,
    [categoria_id, nombre, descripcion, precio, disponible, imagen_url, id]
  )
  return result
}

const updateProductAvailability = async (id, disponible) => {
  const [result] = await db.query(
    `UPDATE producto SET disponible = ? WHERE id = ?`,
    [disponible, id]
  )
  return result
}

const deleteProduct = async (id) => {
  const [result] = await db.query(
    `DELETE FROM producto WHERE id = ?`,
    [id]
  )
  return result
}

const getProductsByCategory = async (categoria_id) => {
  const [rows] = await db.query(
    `SELECT p.id, p.categoria_id, p.nombre, p.descripcion, p.precio,
            p.imagen_url, p.disponible, p.creado_en,
            c.nombre AS categoria_nombre
     FROM producto p
     LEFT JOIN categoria_producto c ON p.categoria_id = c.id
     WHERE p.categoria_id = ?
     ORDER BY p.nombre`,
    [categoria_id]
  )
  return rows
}

module.exports = {
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
  updateProductAvailability,
  deleteProduct,
  getProductsByCategory
}
