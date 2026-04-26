const bcrypt = require("bcryptjs")
const {
  showUsers,
  createUser: createUserModel,
  updateUser: updateUserModel,
  findUserByEmail,
  findUserById
} = require("../models/userModels")

const createUser = async (req, res) => {
  const { nombre, apellido, correo, password, rol = 'camarero', activo = true } = req.body

  if (!nombre || !apellido || !correo || !password) {
    return res.status(400).json({ message: "Nombre, apellido, correo y contraseña son obligatorios" })
  }

  try {
    const existingUser = await findUserByEmail(correo)
    if (existingUser) {
      return res.status(400).json({ message: "El usuario ya existe" })
    }

    const hashedPassword = await bcrypt.hash(password, 10)
    await createUserModel(nombre, apellido, correo, hashedPassword, rol, activo)

    res.status(201).json({ message: "Usuario creado correctamente" })
  } catch (error) {
    console.error(error)
    res.status(500).json({ message: "Error al crear usuario" })
  }
}

const updateUser = async (req, res) => {
  const { id } = req.params
  const { nombre, apellido, correo, rol = 'camarero', activo = true } = req.body

  if (!nombre || !apellido || !correo) {
    return res.status(400).json({ message: "Nombre, apellido y correo son obligatorios" })
  }

  try {
    const existingUser = await findUserById(id)
    if (!existingUser) {
      return res.status(404).json({ message: "Usuario no encontrado" })
    }

    const userWithSameEmail = await findUserByEmail(correo)
    if (userWithSameEmail && userWithSameEmail.id !== Number(id)) {
      return res.status(400).json({ message: "El correo ya está en uso por otro usuario" })
    }

    const result = await updateUserModel(id, nombre, apellido, correo, rol, activo)
    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "Usuario no encontrado" })
    }

    res.json({ message: "Usuario actualizado correctamente" })
  } catch (error) {
    console.error(error)
    res.status(500).json({ message: "Error al actualizar usuario" })
  }
}

const getUsers = async (req, res) => {
  try {
    const users = await showUsers()
    res.json(users)
  } catch (error) {
    console.error(error)
    res.status(500).json({ message: "Error al recuperar usuarios" })
  }
}

module.exports = {
  getUsers,
  createUser,
  updateUser
}