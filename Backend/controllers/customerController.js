const {
  showCustomers,
  createCustomer,
  updateCustomer,
  findCustomerById,
  deleteCustomer
} = require("../models/customerModels")

const getCustomers = async (req, res) => {
  try {
    const customers = await showCustomers()
    res.json(customers)
  } catch (error) {
    console.error(error)
    res.status(500).json({ message: "Error al recuperar clientes" })
  }
}

const createNewCustomer = async (req, res) => {
  const { nombre, telefono, correo, notas } = req.body

  if (!nombre || !telefono) {
    return res.status(400).json({ message: "Nombre y teléfono son obligatorios" })
  }

  try {
    await createCustomer(nombre, telefono, correo, notas)
    res.status(201).json({ message: "Cliente creado correctamente" })
  } catch (error) {
    console.error(error)
    res.status(500).json({ message: "Error al crear cliente" })
  }
}

const updateExistingCustomer = async (req, res) => {
  const { id } = req.params
  const { nombre, telefono, correo, notas } = req.body

  if (!nombre || !telefono) {
    return res.status(400).json({ message: "Nombre y teléfono son obligatorios" })
  }

  try {
    const existingCustomer = await findCustomerById(id)
    if (!existingCustomer) {
      return res.status(404).json({ message: "Cliente no encontrado" })
    }

    const result = await updateCustomer(id, nombre, telefono, correo, notas)
    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "Cliente no encontrado" })
    }

    res.json({ message: "Cliente actualizado correctamente" })
  } catch (error) {
    console.error(error)
    res.status(500).json({ message: "Error al actualizar cliente" })
  }
}

const deleteExistingCustomer = async (req, res) => {
  const { id } = req.params

  try {
    const existingCustomer = await findCustomerById(id)
    if (!existingCustomer) {
      return res.status(404).json({ message: "Cliente no encontrado" })
    }

    const result = await deleteCustomer(id)
    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "Cliente no encontrado" })
    }

    res.json({ message: "Cliente eliminado correctamente" })
  } catch (error) {
    console.error(error)
    res.status(500).json({ message: "Error al eliminar cliente" })
  }
}

module.exports = {
  getCustomers,
  createNewCustomer,
  updateExistingCustomer,
  deleteExistingCustomer
}