const bcrypt = require("bcryptjs")
const jwt = require("jsonwebtoken")
const { findUserByEmail } = require("../models/userModels")

const login = async (req, res) => {

  const { email, password } = req.body

  try {

    const user = await findUserByEmail(email)

    if (!user) {
      return res.status(401).json({ message: "Usuario no encontrado" })
    }

    const validPassword = await bcrypt.compare(password, user.clave_hash)

    if (!validPassword) {
      return res.status(401).json({ message: "Contraseña incorrecta" })
    }

    const token = jwt.sign(
      { id: user.id, email: user.correo },
      "secreto",
      { expiresIn: "8h" }
    )

    res.json({
      token,
      user: {
        id: user.id,
        email: user.correo
      }
    })

  } catch (error) {
    res.status(500).json(error)
  }

}

module.exports = {
  login
}