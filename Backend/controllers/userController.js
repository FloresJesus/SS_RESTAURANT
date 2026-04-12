const bcrypt = require("bcryptjs")
const { showUsers, createUser, findUserByEmail } = require("../models/userModels")

const register = async (req, res) => {

  const { email, password, nombre } = req.body

  try {

    const existingUser = await findUserByEmail(email)

    if (existingUser) {

      return res.status(400).json({
        message: "El usuario ya existe"
      })

    }

    const hashedPassword = await bcrypt.hash(password, 10)

    await createUser(email, hashedPassword, nombre)

    res.json({
      message: "Usuario creado correctamente"
    })

  } catch (error) {

    res.status(500).json({
      message: "Error al crear usuario"
    })

  }

}

const getUsers = async (req, res) => {
  try {
    const users = await showUsers()
    res.json(users)
  } catch (error) {
    res.status(500).json(error)
  }
}


module.exports = {
  getUsers,
  register
}