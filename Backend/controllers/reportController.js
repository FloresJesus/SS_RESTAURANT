const PDFDocument = require("pdfkit")
const path = require("path")
const fs = require("fs")
const db = require("../config/db")
const configDb = require("../config/db")
const { logAudit } = require("../utils/auditLogger")
const reportModels = require("../models/reportModels")

const REPORTES_DIR = path.join(__dirname, "..", "reports")
if (!fs.existsSync(REPORTES_DIR)) {
  fs.mkdirSync(REPORTES_DIR, { recursive: true })
}

const TIPOS = [
  "ventas_diarias", "ventas_periodo", "productos_mas_vendidos",
  "ventas_por_categoria", "ocupacion_mesas", "rendimiento_meseros",
  "historial_pedidos", "historial_pagos", "reservas", "cierre_caja"
]

const TIPOS_LABEL = {
  ventas_diarias: "Ventas Diarias",
  ventas_periodo: "Ventas por Periodo",
  productos_mas_vendidos: "Productos Más Vendidos",
  ventas_por_categoria: "Ventas por Categoría",
  ocupacion_mesas: "Ocupación de Mesas",
  rendimiento_meseros: "Rendimiento de Meseros",
  historial_pedidos: "Historial de Pedidos",
  historial_pagos: "Historial de Pagos",
  reservas: "Reservas",
  cierre_caja: "Cierre de Caja"
}

const getConfig = async () => {
  try {
    const [rows] = await configDb.query("SELECT * FROM configuracion WHERE id = 1")
    return rows[0] || { nombre_restaurante: "SAN SALVADOR", direccion: "", telefono: "", nit: "" }
  } catch {
    return { nombre_restaurante: "SAN SALVADOR", direccion: "", telefono: "", nit: "" }
  }
}

const generateHeader = (doc, config, titulo, fecha_inicio, fecha_fin) => {
  const pageWidth = doc.page.width
  const leftMargin = doc.page.margins.left

  doc.fontSize(18).font("Helvetica-Bold").text(config.nombre_restaurante, leftMargin, 20, { align: "center" })
  doc.fontSize(9).font("Helvetica").text(
    [config.direccion, config.telefono].filter(Boolean).join(" | "),
    { align: "center" }
  )
  doc.fontSize(8).text(`NIT: ${config.nit || "N/A"}`, { align: "center" })

  doc.moveDown(0.5)
  doc.moveTo(leftMargin, doc.y).lineTo(pageWidth - leftMargin, doc.y).strokeColor("#cccccc").stroke()
  doc.moveDown(0.5)

  doc.fontSize(14).font("Helvetica-Bold").text(titulo, { align: "center" })
  doc.fontSize(9).font("Helvetica").text(
    `Periodo: ${new Date(fecha_inicio).toLocaleDateString("es-BO")} - ${new Date(fecha_fin).toLocaleDateString("es-BO")}`,
    { align: "center" }
  )
  doc.fontSize(8).text(`Generado: ${new Date().toLocaleString("es-BO")}`, { align: "center" })
  doc.moveDown(1)
}

const generateFooter = (doc) => {
  const bottomY = doc.page.height - 40
  doc.fontSize(7).font("Helvetica").text(
    `Página ${doc.bufferedPageRange().start + 1}`,
    0,
    bottomY,
    { align: "center", width: doc.page.width }
  )
}

const drawTable = (doc, headers, rows, options = {}) => {
  const { startY = doc.y, fontSize = 8, cellPadding = 4, columnWidths = null } = options
  const pageWidth = doc.page.width
  const leftMargin = doc.page.margins.left
  const rightMargin = pageWidth - leftMargin
  const tableWidth = rightMargin - leftMargin

  const colCount = headers.length
  const widths = columnWidths || Array(colCount).fill(tableWidth / colCount)

  let y = startY

  const drawRow = (cells, isHeader = false) => {
    let maxHeight = cellPadding * 2 + fontSize
    const lineHeight = fontSize + 2
    const cellContents = cells.map((cell, i) => {
      const w = widths[i] - cellPadding * 2
      const lines = doc.font(isHeader ? "Helvetica-Bold" : "Helvetica").fontSize(fontSize)
        .text(cell, leftMargin + widths.slice(0, i).reduce((a, b) => a + b, 0) + cellPadding, y + cellPadding, {
          width: w,
          align: i === 0 ? "left" : "right",
          lineBreak: false,
          ellipsis: true
        })
      return { text: cell, lines }
    })

    const textHeight = Math.max(...cellContents.map(c => {
      const h = doc.heightOfString(c.text, { width: widths[cellContents.indexOf(c)] - cellPadding * 2, fontSize })
      return h
    }))
    const rowHeight = Math.max(textHeight + cellPadding * 2, cellPadding * 2 + fontSize)

    if (y + rowHeight > doc.page.height - 60) {
      generateFooter(doc)
      doc.addPage()
      y = 50
      drawRow(headers, true)
      return y + rowHeight
    }

    doc.rect(leftMargin, y, tableWidth, rowHeight).stroke("#dddddd")
    if (isHeader) {
      doc.rect(leftMargin, y, tableWidth, rowHeight).fill("#f5f5f5")
    }

    let x = leftMargin
    cells.forEach((cell, i) => {
      const w = widths[i]
      doc.fillColor(isHeader ? "#333333" : "#555555")
        .font(isHeader ? "Helvetica-Bold" : "Helvetica")
        .fontSize(fontSize)
        .text(String(cell), x + cellPadding, y + cellPadding, {
          width: w - cellPadding * 2,
          align: i === 0 ? "left" : "right",
          lineBreak: false
        })
      x += w
    })

    doc.fillColor("#000000")
    return y + rowHeight
  }

  y = drawRow(headers, true)
  rows.forEach(row => {
    y = drawRow(row)
  })

  doc.y = y
  return y
}

const formatCurrency = (amount) => {
  return `Bs ${Number(amount || 0).toFixed(2)}`
}

const generateVentasDiarias = async (doc, params) => {
  const fecha = params.fecha || new Date().toISOString().split("T")[0]
  const data = await reportModels.getVentasDiarias(fecha)

  doc.moveDown(0.5)
  doc.fontSize(11).font("Helvetica-Bold").text(`Resumen del ${new Date(fecha).toLocaleDateString("es-BO")}`, { align: "center" })
  doc.moveDown(0.5)

  const summaryData = [
    ["Total Pedidos", String(data.cantidad_pedidos)],
    ["Total Ventas", formatCurrency(data.total_ventas)],
    ["Efectivo", formatCurrency(data.total_efectivo)],
    ["Tarjeta", formatCurrency(data.total_tarjeta)],
    ["QR", formatCurrency(data.total_qr)],
    ["Transferencia", formatCurrency(data.total_transferencia)]
  ]

  drawTable(doc, ["Concepto", "Monto"], summaryData, {
    columnWidths: [250, 150],
    fontSize: 10,
    cellPadding: 6
  })

  return parseFloat(data.total_ventas)
}

const generateVentasPeriodo = async (doc, params) => {
  const { fecha_inicio, fecha_fin } = params
  const rows = await reportModels.getVentasPeriodo(fecha_inicio, fecha_fin)

  if (rows.length === 0) {
    doc.moveDown(1).fontSize(10).text("No se encontraron ventas en el período seleccionado.", { align: "center" })
    return 0
  }

  const headers = ["Fecha", "Pedidos", "Total Ventas"]
  const data = rows.map(r => [
    new Date(r.fecha).toLocaleDateString("es-BO"),
    String(r.cantidad_pedidos),
    formatCurrency(r.total_ventas)
  ])

  drawTable(doc, headers, data, { columnWidths: [150, 100, 150] })

  const total = rows.reduce((sum, r) => sum + parseFloat(r.total_ventas), 0)
  doc.moveDown(0.5)
  doc.fontSize(10).font("Helvetica-Bold").text(`Total General: ${formatCurrency(total)}`, { align: "right" })

  return total
}

const generateProductosMasVendidos = async (doc, params) => {
  const { fecha_inicio, fecha_fin } = params
  const limit = params.limit || 20
  const rows = await reportModels.getProductosMasVendidos(fecha_inicio, fecha_fin, limit)

  if (rows.length === 0) {
    doc.moveDown(1).fontSize(10).text("No se encontraron productos vendidos en el período.", { align: "center" })
    return 0
  }

  const headers = ["#", "Producto", "Categoría", "Cant.", "Total"]
  const data = rows.map((r, i) => [
    String(i + 1),
    r.producto,
    r.categoria || "Sin categoría",
    String(r.cantidad_vendida),
    formatCurrency(r.total_ventas)
  ])

  drawTable(doc, headers, data, { columnWidths: [25, 150, 100, 50, 75] })

  const total = rows.reduce((sum, r) => sum + parseFloat(r.total_ventas), 0)
  doc.moveDown(0.5)
  doc.fontSize(10).font("Helvetica-Bold").text(`Total General: ${formatCurrency(total)}`, { align: "right" })

  return total
}

const generateVentasPorCategoria = async (doc, params) => {
  const { fecha_inicio, fecha_fin } = params
  const rows = await reportModels.getVentasPorCategoria(fecha_inicio, fecha_fin)

  if (rows.length === 0) {
    doc.moveDown(1).fontSize(10).text("No se encontraron ventas por categoría.", { align: "center" })
    return 0
  }

  const headers = ["Categoría", "Productos", "Cant. Vendida", "Total Ventas"]
  const data = rows.map(r => [
    r.categoria || "Sin categoría",
    String(r.cantidad_productos),
    String(r.cantidad_vendida),
    formatCurrency(r.total_ventas)
  ])

  drawTable(doc, headers, data, { columnWidths: [120, 80, 100, 100] })

  const total = rows.reduce((sum, r) => sum + parseFloat(r.total_ventas), 0)
  doc.moveDown(0.5)
  doc.fontSize(10).font("Helvetica-Bold").text(`Total General: ${formatCurrency(total)}`, { align: "right" })

  return total
}

const generateOcupacionMesas = async (doc, params) => {
  const { fecha_inicio, fecha_fin } = params
  const rows = await reportModels.getOcupacionMesas(fecha_inicio, fecha_fin)

  if (rows.length === 0) {
    doc.moveDown(1).fontSize(10).text("No se encontraron datos de mesas.", { align: "center" })
    return 0
  }

  const headers = ["Mesa", "Capacidad", "Pedidos", "Total Ventas"]
  const data = rows.map(r => [
    `Mesa ${r.numero}`,
    String(r.capacidad),
    String(r.total_pedidos),
    formatCurrency(r.total_ventas_mesa)
  ])

  drawTable(doc, headers, data, { columnWidths: [120, 80, 80, 120] })

  const total = rows.reduce((sum, r) => sum + parseFloat(r.total_ventas_mesa), 0)
  doc.moveDown(0.5)
  doc.fontSize(10).font("Helvetica-Bold").text(`Total General: ${formatCurrency(total)}`, { align: "right" })

  return total
}

const generateRendimientoMeseros = async (doc, params) => {
  const { fecha_inicio, fecha_fin } = params
  const rows = await reportModels.getRendimientoMeseros(fecha_inicio, fecha_fin)

  if (rows.length === 0) {
    doc.moveDown(1).fontSize(10).text("No se encontraron datos de meseros.", { align: "center" })
    return 0
  }

  const headers = ["Mesero", "Pedidos", "Total Ventas", "Promedio/Pedido"]
  const data = rows.map(r => [
    `${r.nombre} ${r.apellido || ""}`.trim(),
    String(r.pedidos_atendidos),
    formatCurrency(r.total_ventas),
    formatCurrency(r.promedio_por_pedido)
  ])

  drawTable(doc, headers, data, { columnWidths: [120, 60, 100, 120] })

  const total = rows.reduce((sum, r) => sum + parseFloat(r.total_ventas), 0)
  doc.moveDown(0.5)
  doc.fontSize(10).font("Helvetica-Bold").text(`Total General Ventas: ${formatCurrency(total)}`, { align: "right" })

  return total
}

const generateHistorialPedidos = async (doc, params) => {
  const { fecha_inicio, fecha_fin } = params
  const rows = await reportModels.getHistorialPedidos(fecha_inicio, fecha_fin)

  if (rows.length === 0) {
    doc.moveDown(1).fontSize(10).text("No se encontraron pedidos en el período.", { align: "center" })
    return 0
  }

  const headers = ["# Pedido", "Mesa", "Mesero", "Estado", "Pago", "Total"]
  const data = rows.map(r => [
    `#${r.id}`,
    `Mesa ${r.mesa_numero || "N/A"}`,
    r.mesero_nombre || "N/A",
    r.estado_servicio,
    r.estado_pago,
    formatCurrency(r.total)
  ])

  drawTable(doc, headers, data, { columnWidths: [60, 60, 100, 80, 60, 80] })

  const total = rows.reduce((sum, r) => sum + parseFloat(r.total), 0)
  doc.moveDown(0.5)
  doc.fontSize(10).font("Helvetica-Bold").text(`Total General: ${formatCurrency(total)}`, { align: "right" })
  doc.fontSize(9).font("Helvetica").text(`Total Pedidos: ${rows.length}`, { align: "right" })

  return total
}

const generateHistorialPagos = async (doc, params) => {
  const { fecha_inicio, fecha_fin } = params
  const rows = await reportModels.getHistorialPagos(fecha_inicio, fecha_fin)

  if (rows.length === 0) {
    doc.moveDown(1).fontSize(10).text("No se encontraron pagos en el período.", { align: "center" })
    return 0
  }

  const headers = ["# Pago", "Pedido", "Mesa", "Método", "Referencia", "Monto"]
  const data = rows.map(r => [
    `#${r.id}`,
    `#${r.pedido_id}`,
    `Mesa ${r.mesa_numero || "N/A"}`,
    r.metodo,
    r.referencia || "-",
    formatCurrency(r.monto)
  ])

  drawTable(doc, headers, data, { columnWidths: [55, 55, 60, 70, 80, 80] })

  const total = rows.reduce((sum, r) => sum + parseFloat(r.monto), 0)
  doc.moveDown(0.5)
  doc.fontSize(10).font("Helvetica-Bold").text(`Total General Cobrado: ${formatCurrency(total)}`, { align: "right" })
  doc.fontSize(9).font("Helvetica").text(`Total Transacciones: ${rows.length}`, { align: "right" })

  return total
}

const generateReservas = async (doc, params) => {
  const { fecha_inicio, fecha_fin } = params
  const rows = await reportModels.getReservas(fecha_inicio, fecha_fin)

  if (rows.length === 0) {
    doc.moveDown(1).fontSize(10).text("No se encontraron reservas en el período.", { align: "center" })
    return 0
  }

  const headers = ["#", "Cliente", "Mesa", "Personas", "Inicio", "Estado"]
  const data = rows.map((r, i) => [
    String(i + 1),
    r.cliente_nombre || "N/A",
    `Mesa ${r.mesa_numero}`,
    String(r.cantidad_personas),
    new Date(r.fecha_hora_inicio).toLocaleString("es-BO", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" }),
    r.estado
  ])

  drawTable(doc, headers, data, { columnWidths: [25, 100, 55, 50, 100, 70] })

  const confirmadas = rows.filter(r => r.estado === "confirmada").length
  const pendientes = rows.filter(r => r.estado === "pendiente").length
  const canceladas = rows.filter(r => r.estado === "cancelada").length
  const completadas = rows.filter(r => r.estado === "completada").length

  doc.moveDown(0.5)
  doc.fontSize(9).font("Helvetica").text(
    `Total: ${rows.length} | Confirmadas: ${confirmadas} | Pendientes: ${pendientes} | Canceladas: ${canceladas} | Completadas: ${completadas}`,
    { align: "center" }
  )

  return 0
}

const generateCierreCaja = async (doc, params) => {
  const fecha = params.fecha || new Date().toISOString().split("T")[0]
  const data = await reportModels.getCierreCaja(fecha)

  doc.moveDown(0.5)
  doc.fontSize(11).font("Helvetica-Bold").text(`Resumen del ${new Date(fecha).toLocaleDateString("es-BO")}`, { align: "center" })
  doc.moveDown(0.5)

  const r = data.resumen
  const summaryHeaders = ["Concepto", "Valor"]
  const summaryData = [
    ["Total Pedidos", String(r.total_pedidos)],
    ["Pedidos Pagados", String(r.pedidos_pagados)],
    ["Pedidos Pendientes", String(r.pedidos_pendientes)],
    ["Pedidos Anulados", String(r.pedidos_anulados)],
    ["Ventas Brutas", formatCurrency(r.total_ventas_brutas)]
  ]

  drawTable(doc, summaryHeaders, summaryData, { columnWidths: [250, 150], fontSize: 10, cellPadding: 6 })

  doc.moveDown(1)
  doc.fontSize(11).font("Helvetica-Bold").text("Desglose por Método de Pago", { align: "center" })
  doc.moveDown(0.5)

  const payHeaders = ["Método", "Total"]
  const payData = (data.pagos_por_metodo || []).map(p => [
    p.metodo,
    formatCurrency(p.total)
  ])

  if (payData.length === 0) {
    doc.fontSize(9).text("No se registraron pagos en esta fecha.", { align: "center" })
  } else {
    drawTable(doc, payHeaders, payData, { columnWidths: [200, 200], fontSize: 10, cellPadding: 6 })
  }

  const totalPagado = (data.pagos_por_metodo || []).reduce((sum, p) => sum + parseFloat(p.total), 0)
  doc.moveDown(0.5)
  doc.fontSize(11).font("Helvetica-Bold").text(`Total Cobrado: ${formatCurrency(totalPagado)}`, { align: "right" })

  return totalPagado || parseFloat(r.total_ventas_brutas)
}

const GENERATORS = {
  ventas_diarias: generateVentasDiarias,
  ventas_periodo: generateVentasPeriodo,
  productos_mas_vendidos: generateProductosMasVendidos,
  ventas_por_categoria: generateVentasPorCategoria,
  ocupacion_mesas: generateOcupacionMesas,
  rendimiento_meseros: generateRendimientoMeseros,
  historial_pedidos: generateHistorialPedidos,
  historial_pagos: generateHistorialPagos,
  reservas: generateReservas,
  cierre_caja: generateCierreCaja
}

const generatePDF = async (tipo, params, usuario_id) => {
  const config = await getConfig()
  const fecha_inicio = params.fecha_inicio || params.fecha || new Date().toISOString().split("T")[0]
  const fecha_fin = params.fecha_fin || params.fecha || new Date().toISOString().split("T")[0]
  const timestamp = Date.now()
  const filename = `${tipo}_${timestamp}.pdf`
  const filepath = path.join(REPORTES_DIR, filename)

  const doc = new PDFDocument({ margin: 40, size: "A4" })
  const stream = fs.createWriteStream(filepath)
  doc.pipe(stream)

  generateHeader(doc, config, TIPOS_LABEL[tipo] || tipo, fecha_inicio, fecha_fin)

  const generator = GENERATORS[tipo]
  let totalGenerado = 0
  if (generator) {
    totalGenerado = await generator(doc, { ...params, fecha_inicio, fecha_fin })
  }

  generateFooter(doc)
  doc.end()

  return new Promise((resolve, reject) => {
    stream.on("finish", async () => {
      try {
        const reportId = await reportModels.createReport(
          usuario_id, tipo, JSON.stringify(params),
          fecha_inicio, fecha_fin, totalGenerado, filename
        )
        resolve({ id: reportId, filename, total_generado: totalGenerado })
      } catch (err) {
        reject(err)
      }
    })
    stream.on("error", reject)
  })
}

const generateReport = async (req, res) => {
  const { tipo } = req.params

  if (!TIPOS.includes(tipo)) {
    return res.status(400).json({ message: `Tipo de reporte inválido. Tipos: ${TIPOS.join(", ")}` })
  }

  try {
    const params = req.body

    const result = await generatePDF(tipo, params, req.user.id)
    await logAudit(req.user.id, "GENERAR", "reportes", result.id, `Reporte ${tipo} generado`, req.ip)

    res.status(201).json({
      id: result.id,
      tipo,
      archivo_pdf: result.filename,
      total_generado: result.total_generado,
      message: "Reporte generado correctamente"
    })
  } catch (error) {
    console.error("Error al generar reporte:", error)
    res.status(500).json({ message: "Error al generar reporte" })
  }
}

const getReportsList = async (req, res) => {
  try {
    const { tipo } = req.query
    let reports = await reportModels.getReports()

    if (tipo) {
      reports = reports.filter(r => r.tipo === tipo)
    }

    res.json(reports.map(r => ({
      ...r,
      parametros: r.parametros ? (typeof r.parametros === 'string' ? JSON.parse(r.parametros) : r.parametros) : null
    })))
  } catch (error) {
    console.error("Error al obtener reportes:", error)
    res.status(500).json({ message: "Error al obtener reportes" })
  }
}

const getReportById = async (req, res) => {
  const { id } = req.params

  try {
    const report = await reportModels.findReportById(id)
    if (!report) {
      return res.status(404).json({ message: "Reporte no encontrado" })
    }

    res.json({
      ...report,
      parametros: report.parametros ? (typeof report.parametros === 'string' ? JSON.parse(report.parametros) : report.parametros) : null
    })
  } catch (error) {
    console.error("Error al obtener reporte:", error)
    res.status(500).json({ message: "Error al obtener reporte" })
  }
}

const downloadReport = async (req, res) => {
  const { id } = req.params

  try {
    const report = await reportModels.findReportById(id)
    if (!report) {
      return res.status(404).json({ message: "Reporte no encontrado" })
    }

    const filepath = path.join(REPORTES_DIR, report.archivo_pdf)
    if (!fs.existsSync(filepath)) {
      return res.status(404).json({ message: "Archivo PDF no encontrado" })
    }

    res.download(filepath, `${report.tipo}_${report.id}.pdf`)
  } catch (error) {
    console.error("Error al descargar reporte:", error)
    res.status(500).json({ message: "Error al descargar reporte" })
  }
}

const deleteReport = async (req, res) => {
  const { id } = req.params

  try {
    const report = await reportModels.findReportById(id)
    if (!report) {
      return res.status(404).json({ message: "Reporte no encontrado" })
    }

    const filepath = path.join(REPORTES_DIR, report.archivo_pdf)
    if (fs.existsSync(filepath)) {
      fs.unlinkSync(filepath)
    }

    await reportModels.deleteReport(id)
    await logAudit(req.user.id, "ELIMINAR", "reportes", Number(id), `Reporte ${id} eliminado`, req.ip)

    res.json({ message: "Reporte eliminado correctamente" })
  } catch (error) {
    console.error("Error al eliminar reporte:", error)
    res.status(500).json({ message: "Error al eliminar reporte" })
  }
}

const getTipos = async (req, res) => {
  res.json(TIPOS.map(t => ({ value: t, label: TIPOS_LABEL[t] })))
}

module.exports = {
  generateReport,
  getReportsList,
  getReportById,
  downloadReport,
  deleteReport,
  getTipos
}
