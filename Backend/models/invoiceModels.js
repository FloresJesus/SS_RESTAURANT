const db = require("../config/db")

const TAX_RATE = 0.13

const getInvoices = async () => {
  const [rows] = await db.query(
    `SELECT f.id, f.pedido_id, f.numero_factura, f.nit_ci, f.razon_social,
            f.subtotal, f.impuesto, f.total, f.codigo_control, f.qr_url, f.fecha,
            p.estado_pago, m.numero AS mesa_numero
     FROM factura f
     JOIN pedido p ON f.pedido_id = p.id
     LEFT JOIN mesa m ON p.mesa_id = m.id
     ORDER BY f.fecha DESC, f.numero_factura DESC`
  )
  return rows
}

const findInvoiceById = async (id) => {
  const [rows] = await db.query(
    `SELECT f.id, f.pedido_id, f.numero_factura, f.nit_ci, f.razon_social,
            f.subtotal, f.impuesto, f.total, f.codigo_control, f.qr_url, f.fecha,
            p.estado_pago, m.numero AS mesa_numero
     FROM factura f
     JOIN pedido p ON f.pedido_id = p.id
     LEFT JOIN mesa m ON p.mesa_id = m.id
     WHERE f.id = ?`,
    [id]
  )
  return rows[0]
}

const findInvoiceByOrderId = async (pedido_id) => {
  const [rows] = await db.query(
    `SELECT f.id, f.pedido_id, f.numero_factura, f.nit_ci, f.razon_social,
            f.subtotal, f.impuesto, f.total, f.codigo_control, f.qr_url, f.fecha
     FROM factura f
     WHERE f.pedido_id = ?`,
    [pedido_id]
  )
  return rows[0]
}

const findInvoiceByNumero = async (numero_factura) => {
  const [rows] = await db.query(
    `SELECT f.id, f.pedido_id, f.numero_factura, f.nit_ci, f.razon_social,
            f.subtotal, f.impuesto, f.total, f.codigo_control, f.qr_url, f.fecha,
            p.estado_pago, m.numero AS mesa_numero
     FROM factura f
     JOIN pedido p ON f.pedido_id = p.id
     LEFT JOIN mesa m ON p.mesa_id = m.id
     WHERE f.numero_factura = ?`,
    [numero_factura]
  )
  return rows[0]
}

const getNextInvoiceNumber = async () => {
  const year = new Date().getFullYear()
  const [rows] = await db.query(
    `SELECT COALESCE(MAX(CAST(SUBSTRING_INDEX(numero_factura, '-', -1) AS UNSIGNED)), 0) + 1 AS siguiente_numero
     FROM factura
     WHERE numero_factura LIKE ?`,
    [`${year}-%`]
  )
  return `${year}-${String(rows[0].siguiente_numero).padStart(6, '0')}`
}

const createInvoice = async (pedido_id, nit_ci, razon_social, codigo_control = null, qr_url = null) => {
  const connection = await db.getConnection()
  
  try {
    await connection.beginTransaction()
    
    const [existingInvoice] = await connection.query(
      `SELECT id FROM factura WHERE pedido_id = ?`,
      [pedido_id]
    )
    if (existingInvoice.length > 0) {
      throw new Error('Este pedido ya tiene una factura asociada')
    }
    
    const [orderData] = await connection.query(
      `SELECT id, estado_pago FROM pedido WHERE id = ?`,
      [pedido_id]
    )
    if (!orderData[0]) {
      throw new Error('Pedido no encontrado')
    }
    
    const [details] = await connection.query(
      `SELECT COALESCE(SUM(subtotal), 0) AS subtotal
       FROM detalle_pedido
       WHERE pedido_id = ?`,
      [pedido_id]
    )
    const subtotal = parseFloat(details[0].subtotal)
    const impuesto = parseFloat((subtotal * TAX_RATE).toFixed(2))
    const total = parseFloat((subtotal + impuesto).toFixed(2))
    
    const numero_factura = await getNextInvoiceNumber()
    
    const [result] = await connection.query(
      `INSERT INTO factura (pedido_id, numero_factura, nit_ci, razon_social, subtotal, impuesto, total, codigo_control, qr_url)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [pedido_id, numero_factura, nit_ci, razon_social, subtotal, impuesto, total, codigo_control, qr_url]
    )
    
    await connection.commit()
    
    return {
      id: result.insertId,
      pedido_id,
      numero_factura,
      nit_ci,
      razon_social,
      subtotal,
      impuesto,
      total,
      codigo_control,
      qr_url
    }
  } catch (error) {
    await connection.rollback()
    throw error
  } finally {
    connection.release()
  }
}

const getInvoiceWithDetails = async (id) => {
  const invoice = await findInvoiceById(id)
  if (!invoice) return null
  
  const [details] = await db.query(
    `SELECT dp.cantidad, dp.precio_unitario, dp.subtotal,
            pr.nombre AS producto_nombre
     FROM detalle_pedido dp
     JOIN producto pr ON dp.producto_id = pr.id
     WHERE dp.pedido_id = ?`,
    [invoice.pedido_id]
  )
  
  return {
    ...invoice,
    detalles: details
  }
}

const getInvoicesByDate = async (fecha) => {
  const [rows] = await db.query(
    `SELECT f.id, f.pedido_id, f.numero_factura, f.nit_ci, f.razon_social,
            f.subtotal, f.impuesto, f.total, f.codigo_control, f.qr_url, f.fecha,
            p.estado_pago, m.numero AS mesa_numero
     FROM factura f
     JOIN pedido p ON f.pedido_id = p.id
     LEFT JOIN mesa m ON p.mesa_id = m.id
     WHERE DATE(f.fecha) = ?
     ORDER BY f.numero_factura DESC`,
    [fecha]
  )
  return rows
}

const getTodayInvoices = async () => {
  const today = new Date().toISOString().split('T')[0]
  return getInvoicesByDate(today)
}

const getInvoicesSummary = async () => {
  const [rows] = await db.query(
    `SELECT 
       COUNT(*) AS cantidad_facturas,
       SUM(subtotal) AS total_subtotal,
       SUM(impuesto) AS total_impuesto,
       SUM(total) AS total_general
     FROM factura
     WHERE DATE(fecha) = CURDATE()`
  )
  return rows[0]
}

module.exports = {
  getInvoices,
  findInvoiceById,
  findInvoiceByOrderId,
  findInvoiceByNumero,
  getNextInvoiceNumber,
  createInvoice,
  getInvoiceWithDetails,
  getInvoicesByDate,
  getTodayInvoices,
  getInvoicesSummary
}
