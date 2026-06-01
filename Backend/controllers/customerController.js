const { logAudit } = require("../utils/auditLogger")
const {
  showCustomers,
  findCustomerById,
  findCustomerByEmail,
  createCustomer,
  updateCustomer,
  deleteCustomer,
  searchCustomers
} = require("../models/customerModels")

const getCustomers = async (req, res) => {
  const { search } = req.query

  try {
    let customers
    if (search) {
      customers = await searchCustomers(search)
    } else {
      customers = await showCustomers()
    }
    res.json(customers)
  } catch (error) {
    console.error("Error al recuperar clientes:", error)
    res.status(500).json({ message: "Error al recuperar clientes" })
  }
}

const getCustomerById = async (req, res) => {
  const { id } = req.params

  try {
    const customer = await findCustomerById(id)
    if (!customer) {
      return res.status(404).json({ message: "Cliente no encontrado" })
    }
    res.json(customer)
  } catch (error) {
    console.error("Error al recuperar cliente:", error)
    res.status(500).json({ message: "Error al recuperar cliente" })
  }
}

const createNewCustomer = async (req, res) => {
  const { nombre, telefono, email = null } = req.body

  if (!nombre || !telefono) {
    return res.status(400).json({ message: "Nombre y telefono son obligatorios" })
  }

  try {
    const result = await createCustomer(nombre, telefono, email)
    await logAudit(req.user.id, 'CREAR', 'clientes', result.insertId, `Cliente ${nombre} creado`, req.ip)
    res.status(201).json({
      message: "Cliente creado correctamente",
      id: result.insertId
    })
  } catch (error) {
    console.error("Error al crear cliente:", error)
    res.status(500).json({ message: "Error al crear cliente" })
  }
}

const updateExistingCustomer = async (req, res) => {
  const { id } = req.params
  const { nombre, telefono, email = null } = req.body

  if (!nombre || !telefono) {
    return res.status(400).json({ message: "Nombre y telefono son obligatorios" })
  }

  try {
    const existingCustomer = await findCustomerById(id)
    if (!existingCustomer) {
      return res.status(404).json({ message: "Cliente no encontrado" })
    }

    const result = await updateCustomer(id, nombre, telefono, email)
    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "Cliente no encontrado" })
    }
    await logAudit(req.user.id, 'ACTUALIZAR', 'clientes', Number(id), `Cliente ${nombre} actualizado`, req.ip)
    res.json({ message: "Cliente actualizado correctamente" })
  } catch (error) {
    console.error("Error al actualizar cliente:", error)
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
    await logAudit(req.user.id, 'ELIMINAR', 'clientes', Number(id), `Cliente ${existingCustomer.nombre} eliminado`, req.ip)
    res.json({ message: "Cliente eliminado correctamente" })
  } catch (error) {
    console.error("Error al eliminar cliente:", error)
    res.status(500).json({ message: "Error al eliminar cliente" })
  }
}

module.exports = {
  getCustomers,
  getCustomerById,
  createNewCustomer,
  updateExistingCustomer,
  deleteExistingCustomer
}
