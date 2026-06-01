const { getAuditLogs, getAuditLogsWithFilters, createAuditLog } = require("../models/auditModels")

const getAudit = async (req, res) => {
  const { accion, tabla, usuario_id, desde, hasta } = req.query

  try {
    let entries
    if (accion || tabla || usuario_id || desde || hasta) {
      entries = await getAuditLogsWithFilters({ accion, tabla, usuario_id, desde, hasta })
    } else {
      entries = await getAuditLogs()
    }
    res.json(entries)
  } catch (error) {
    console.error("Error al recuperar auditoria:", error)
    res.status(500).json({ message: "Error al recuperar auditoria" })
  }
}

const logAuditEntry = async (req, res) => {
  const { accion, tabla, registro_id, detalle } = req.body

  if (!accion || !tabla) {
    return res.status(400).json({ message: "accion y tabla son obligatorios" })
  }

  try {
    const ip = req.ip || req.connection?.remoteAddress || null
    await createAuditLog(req.user.id, accion, tabla, registro_id || null, detalle || null, ip)
    res.status(201).json({ message: "Auditoria registrada correctamente" })
  } catch (error) {
    console.error("Error al registrar auditoria:", error)
    res.status(500).json({ message: "Error al registrar auditoria" })
  }
}

module.exports = { getAudit, logAuditEntry }
