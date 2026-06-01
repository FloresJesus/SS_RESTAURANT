const { logAudit } = require("../utils/auditLogger")
const {
  getInvoices,
  findInvoiceById,
  findInvoiceByOrderId,
  findInvoiceByNumero,
  createInvoice,
  getInvoiceWithDetails,
  getInvoicesByDate,
  getTodayInvoices,
  getInvoicesSummary
} = require("../models/invoiceModels")

const getAllInvoices = async (req, res) => {
  const { fecha } = req.query

  try {
    let invoices
    if (fecha) {
      invoices = await getInvoicesByDate(fecha)
    } else {
      invoices = await getInvoices()
    }
    res.json(invoices)
  } catch (error) {
    console.error("Error al recuperar facturas:", error)
    res.status(500).json({ message: "Error al recuperar facturas" })
  }
}

const getInvoiceById = async (req, res) => {
  const { id } = req.params

  try {
    const invoice = await getInvoiceWithDetails(id)
    if (!invoice) {
      return res.status(404).json({ message: "Factura no encontrada" })
    }
    res.json(invoice)
  } catch (error) {
    console.error("Error al recuperar la factura:", error)
    res.status(500).json({ message: "Error al recuperar la factura" })
  }
}

const getInvoiceByOrderId = async (req, res) => {
  const { pedido_id } = req.params

  try {
    const invoice = await findInvoiceByOrderId(pedido_id)
    if (!invoice) {
      return res.status(404).json({ message: "Factura no encontrada para este pedido" })
    }
    const invoiceWithDetails = await getInvoiceWithDetails(invoice.id)
    res.json(invoiceWithDetails)
  } catch (error) {
    console.error("Error al recuperar la factura:", error)
    res.status(500).json({ message: "Error al recuperar la factura" })
  }
}

const getInvoiceByNumero = async (req, res) => {
  const { numero } = req.params

  try {
    const invoice = await findInvoiceByNumero(numero)
    if (!invoice) {
      return res.status(404).json({ message: "Factura no encontrada" })
    }
    const invoiceWithDetails = await getInvoiceWithDetails(invoice.id)
    res.json(invoiceWithDetails)
  } catch (error) {
    console.error("Error al recuperar la factura:", error)
    res.status(500).json({ message: "Error al recuperar la factura" })
  }
}

const generateInvoice = async (req, res) => {
  const { pedido_id, nit_ci, razon_social, codigo_control = null, qr_url = null } = req.body

  if (!pedido_id || !nit_ci || !razon_social) {
    return res.status(400).json({
      message: "pedido_id, nit_ci y razon_social son obligatorios"
    })
  }

  try {
    const existingInvoice = await findInvoiceByOrderId(pedido_id)
    if (existingInvoice) {
      return res.status(400).json({
        message: "Este pedido ya tiene una factura asociada",
        factura: existingInvoice
      })
    }

    const invoice = await createInvoice(pedido_id, nit_ci, razon_social, codigo_control, qr_url)
    await logAudit(req.user.id, 'CREAR', 'facturas', invoice.id, `Factura ${invoice.numero_factura} para pedido ${pedido_id}`, req.ip)
    res.status(201).json({
      message: "Factura generada correctamente",
      factura: invoice
    })
  } catch (error) {
    console.error("Error al generar la factura:", error)
    res.status(500).json({ message: error.message || "Error al generar la factura" })
  }
}

const getTodayInvoicesList = async (req, res) => {
  try {
    const invoices = await getTodayInvoices()
    res.json(invoices)
  } catch (error) {
    console.error("Error al recuperar facturas del dia:", error)
    res.status(500).json({ message: "Error al recuperar facturas del dia" })
  }
}

const getInvoicesSummaryToday = async (req, res) => {
  try {
    const summary = await getInvoicesSummary()
    res.json(summary)
  } catch (error) {
    console.error("Error al obtener resumen de facturas:", error)
    res.status(500).json({ message: "Error al obtener resumen de facturas" })
  }
}

module.exports = {
  getAllInvoices,
  getInvoiceById,
  getInvoiceByOrderId,
  getInvoiceByNumero,
  generateInvoice,
  getTodayInvoicesList,
  getInvoicesSummaryToday
}
