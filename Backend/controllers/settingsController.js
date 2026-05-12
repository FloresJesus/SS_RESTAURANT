const { getSettings, updateSettings } = require("../models/settingsModels")

const getConfig = async (req, res) => {
  try {
    const settings = await getSettings()
    res.json(settings)
  } catch (error) {
    console.error("Error al obtener configuracion:", error)
    res.status(500).json({ message: "Error al obtener configuracion" })
  }
}

const updateConfig = async (req, res) => {
  const { nombre_restaurante, direccion, telefono, nit } = req.body

  if (!nombre_restaurante) {
    return res.status(400).json({ message: "El nombre del restaurante es obligatorio" })
  }

  try {
    await updateSettings(
      nombre_restaurante,
      direccion || '',
      telefono || '',
      nit || ''
    )
    res.json({ message: "Configuracion actualizada correctamente" })
  } catch (error) {
    console.error("Error al actualizar configuracion:", error)
    res.status(500).json({ message: "Error al actualizar configuracion" })
  }
}

module.exports = { getConfig, updateConfig }
