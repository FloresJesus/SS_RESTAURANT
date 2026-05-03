const checkRole = (allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ message: "Usuario no autenticado" })
    }

    if (!allowedRoles.includes(req.user.rol)) {
      return res.status(403).json({ message: "Acceso denegado: rol no autorizado" })
    }

    next()
  }
}

module.exports = { checkRole }
