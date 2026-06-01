const bcrypt = require("bcryptjs")
const jwt = require("jsonwebtoken")
const { logAudit } = require("../utils/auditLogger")
const { findUserByEmail } = require("../models/userModels")

const login = async (req, res) => {
  const { email, password } = req.body

  try {
    if (!email || !password) {
      return res.status(400).json({ message: "Email y contrasena son requeridos" })
    }

    const user = await findUserByEmail(email)

    if (!user) {
      return res.status(401).json({ message: "Usuario no encontrado" })
    }

    if (!user.activo) {
      return res.status(401).json({ message: "Usuario inactivo" })
    }

    const validPassword = await bcrypt.compare(password, user.password_hash)

    if (!validPassword) {
      return res.status(401).json({ message: "Contrasena incorrecta" })
    }

    const token = jwt.sign(
      { id: user.id, email: user.email, rol: user.rol },
      process.env.JWT_SECRET || "secreto",
      { expiresIn: "8h" }
    )

    await logAudit(user.id, 'LOGIN', 'usuarios', user.id, `Inicio de sesion: ${user.email}`, req.ip)
    res.json({
      token,
      user: {
        id: user.id,
        nombre: user.nombre,
        apellido: user.apellido,
        email: user.email,
        rol: user.rol,
        activo: Boolean(user.activo)
      }
    })
  } catch (error) {
    console.error("Error en login:", error)
    res.status(500).json({ message: "Error interno del servidor" })
  }
}

module.exports = {
  login
}
