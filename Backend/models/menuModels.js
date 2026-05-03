const db = require("../config/db")

const getMenuItems = async () => {
  const [rows] = await db.query(
    `SELECT id, categoria, nombre, descripcion, precio, disponible, tiempo_cocina_min, nota_alergenos, imagen, creado_en
     FROM plato
     ORDER BY creado_en DESC`
  )
  return rows
}

const findMenuItemById = async (id) => {
  const [rows] = await db.query(
    `SELECT id, categoria, nombre, descripcion, precio, disponible, tiempo_cocina_min, nota_alergenos, imagen, creado_en
     FROM plato
     WHERE id = ?`,
    [id]
  )
  return rows[0]
}

const createMenuItem = async (
  categoria,
  nombre,
  descripcion,
  precio,
  disponible = true,
  tiempo_cocina_min = 15,
  nota_alergenos = null,
  imagen = null
) => {
  const [result] = await db.query(
    `INSERT INTO plato (categoria, nombre, descripcion, precio, disponible, tiempo_cocina_min, nota_alergenos, imagen)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [categoria, nombre, descripcion, precio, disponible, tiempo_cocina_min, nota_alergenos, imagen]
  )
  return result
}

const updateMenuItem = async (
  id,
  categoria,
  nombre,
  descripcion,
  precio,
  disponible,
  tiempo_cocina_min,
  nota_alergenos,
  imagen
) => {
  const [result] = await db.query(
    `UPDATE plato
     SET categoria = ?, nombre = ?, descripcion = ?, precio = ?, disponible = ?, tiempo_cocina_min = ?, nota_alergenos = ?, imagen = ?
     WHERE id = ?`,
    [categoria, nombre, descripcion, precio, disponible, tiempo_cocina_min, nota_alergenos, imagen, id]
  )
  return result
}

const deleteMenuItem = async (id) => {
  const [result] = await db.query(
    "DELETE FROM plato WHERE id = ?",
    [id]
  )
  return result
}

module.exports = {
  getMenuItems,
  findMenuItemById,
  createMenuItem,
  updateMenuItem,
  deleteMenuItem
}
