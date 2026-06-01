const bcrypt = require("bcryptjs")
const { logAudit } = require("../utils/auditLogger")
const {
  showUsers,
  findUserById,
  findUserByEmail,
  createUser: createUserModel,
  updateUser: updateUserModel,
  deleteUser
} = require("../models/userModels")

const getUsers = async (req, res) => {
  try {
    const users = await showUsers()
    res.json(users)
  } catch (error) {
    console.error("Error al recuperar usuarios:", error)
    res.status(500).json({ message: "Error al recuperar usuarios" })
  }
}

const getUserById = async (req, res) => {
  const { id } = req.params

  try {
    const user = await findUserById(id)
    if (!user) {
      return res.status(404).json({ message: "Usuario no encontrado" })
    }
    res.json(user)
  } catch (error) {
    console.error("Error al recuperar usuario:", error)
    res.status(500).json({ message: "Error al recuperar usuario" })
  }
}

const createUser = async (req, res) => {
  const { nombre, apellido, email, password, rol = 'mesero', activo = true } = req.body

  if (!nombre || !email || !password) {
    return res.status(400).json({ message: "Nombre, email y contrasena son obligatorios" })
  }

  const validRoles = ['admin', 'cajero', 'mesero', 'cocina']
  if (rol && !validRoles.includes(rol)) {
    return res.status(400).json({ message: `Rol invalido. Roles validos: ${validRoles.join(', ')}` })
  }

  try {
    const existingUser = await findUserByEmail(email)
    if (existingUser) {
      return res.status(400).json({ message: "El email ya esta registrado" })
    }

    const hashedPassword = await bcrypt.hash(password, 10)
    const result = await createUserModel(nombre, apellido, email, hashedPassword, rol, activo)
    await logAudit(req.user.id, 'CREAR', 'usuarios', result.insertId, `Usuario ${nombre} ${apellido || ''} creado`, req.ip)
    res.status(201).json({
      message: "Usuario creado correctamente",
      id: result.insertId
    })
  } catch (error) {
    console.error("Error al crear usuario:", error)
    res.status(500).json({ message: "Error al crear usuario" })
  }
}

const updateUser = async (req, res) => {
  const { id } = req.params
  const { nombre, apellido, email, rol, activo = true } = req.body

  if (!nombre || !email) {
    return res.status(400).json({ message: "Nombre y email son obligatorios" })
  }

  const validRoles = ['admin', 'cajero', 'mesero', 'cocina']
  if (rol && !validRoles.includes(rol)) {
    return res.status(400).json({ message: `Rol invalido. Roles validos: ${validRoles.join(', ')}` })
  }

  try {
    const existingUser = await findUserById(id)
    if (!existingUser) {
      return res.status(404).json({ message: "Usuario no encontrado" })
    }

    const userWithSameEmail = await findUserByEmail(email)
    if (userWithSameEmail && userWithSameEmail.id !== Number(id)) {
      return res.status(400).json({ message: "El email ya esta en uso por otro usuario" })
    }

    const result = await updateUserModel(id, nombre, apellido, email, rol || existingUser.rol, activo)
    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "Usuario no encontrado" })
    }
    await logAudit(req.user.id, 'ACTUALIZAR', 'usuarios', Number(id), `Usuario ${nombre} ${apellido || ''} actualizado`, req.ip)
    res.json({ message: "Usuario actualizado correctamente" })
  } catch (error) {
    console.error("Error al actualizar usuario:", error)
    res.status(500).json({ message: "Error al actualizar usuario" })
  }
}

const deleteUserById = async (req, res) => {
  const { id } = req.params

  try {
    const existingUser = await findUserById(id)
    if (!existingUser) {
      return res.status(404).json({ message: "Usuario no encontrado" })
    }

    const result = await deleteUser(id)
    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "Usuario no encontrado" })
    }
    await logAudit(req.user.id, 'ELIMINAR', 'usuarios', Number(id), `Usuario ${existingUser.nombre} ${existingUser.apellido || ''} eliminado`, req.ip)
    res.json({ message: "Usuario eliminado correctamente" })
  } catch (error) {
    console.error("Error al eliminar usuario:", error)
    res.status(500).json({ message: "Error al eliminar usuario" })
  }
}

module.exports = {
  getUsers,
  getUserById,
  createUser,
  updateUser,
  deleteUserById
}
