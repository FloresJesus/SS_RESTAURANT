const jwt = require("jsonwebtoken")
const { findUserById } = require("../models/userModels")

const verifyToken = async (req, res, next) => {
  const authHeader = req.headers["authorization"]
  const token = authHeader && authHeader.split(" ")[1]

  if (!token) {
    return res.status(401).json({ message: "Token de acceso requerido" })
  }

  try {
    const decoded = jwt.verify(token, "secreto")
    req.user = decoded

    if (!req.user.rol) {
      const user = await findUserById(decoded.id)
      if (user) {
        req.user.rol = user.rol
      }
    }

    next()
  } catch (error) {
    return res.status(403).json({ message: "Token inválido o expirado" })
  }
}

module.exports = { verifyToken }
