const db = require("../config/db")

const createReport = async (usuario_id, tipo, parametros, fecha_inicio, fecha_fin, total_generado, archivo_pdf) => {
  const params = typeof parametros === 'object' ? JSON.stringify(parametros) : parametros
  const [result] = await db.query(
    `INSERT INTO reporte (usuario_id, tipo, parametros, fecha_inicio, fecha_fin, total_generado, archivo_pdf)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [usuario_id, tipo, params, fecha_inicio, fecha_fin, total_generado, archivo_pdf]
  )
  return result.insertId
}

const getReports = async () => {
  const [rows] = await db.query(
    `SELECT r.id, r.usuario_id, u.nombre AS usuario_nombre, u.email AS usuario_email,
            r.tipo, r.parametros, r.fecha_inicio, r.fecha_fin,
            r.total_generado, r.archivo_pdf, r.creado_en
     FROM reporte r
     LEFT JOIN usuario u ON r.usuario_id = u.id
     ORDER BY r.creado_en DESC`
  )
  return rows
}

const findReportById = async (id) => {
  const [rows] = await db.query(
    `SELECT r.id, r.usuario_id, u.nombre AS usuario_nombre, u.email AS usuario_email,
            r.tipo, r.parametros, r.fecha_inicio, r.fecha_fin,
            r.total_generado, r.archivo_pdf, r.creado_en
     FROM reporte r
     LEFT JOIN usuario u ON r.usuario_id = u.id
     WHERE r.id = ?`,
    [id]
  )
  return rows[0]
}

const deleteReport = async (id) => {
  const [result] = await db.query(`DELETE FROM reporte WHERE id = ?`, [id])
  return result
}

const getVentasDiarias = async (fecha) => {
  const [rows] = await db.query(
    `SELECT
       DATE(p.creado_en) AS fecha,
       COUNT(DISTINCT p.id) AS cantidad_pedidos,
       COALESCE(SUM(dp.subtotal), 0) AS total_ventas,
       COALESCE(SUM(CASE WHEN pg.metodo = 'efectivo' THEN pg.monto ELSE 0 END), 0) AS total_efectivo,
       COALESCE(SUM(CASE WHEN pg.metodo = 'tarjeta' THEN pg.monto ELSE 0 END), 0) AS total_tarjeta,
       COALESCE(SUM(CASE WHEN pg.metodo = 'qr' THEN pg.monto ELSE 0 END), 0) AS total_qr,
       COALESCE(SUM(CASE WHEN pg.metodo = 'transferencia' THEN pg.monto ELSE 0 END), 0) AS total_transferencia
     FROM pedido p
     LEFT JOIN detalle_pedido dp ON p.id = dp.pedido_id
     LEFT JOIN pago pg ON pg.pedido_id = p.id
     WHERE DATE(p.creado_en) = ?
       AND p.estado_pago IN ('pagado', 'pendiente')
     GROUP BY DATE(p.creado_en)`,
    [fecha]
  )
  return rows[0] || { fecha, cantidad_pedidos: 0, total_ventas: 0, total_efectivo: 0, total_tarjeta: 0, total_qr: 0, total_transferencia: 0 }
}

const getVentasPeriodo = async (fecha_inicio, fecha_fin) => {
  const [rows] = await db.query(
    `SELECT
       DATE(p.creado_en) AS fecha,
       COUNT(DISTINCT p.id) AS cantidad_pedidos,
       COALESCE(SUM(dp.subtotal), 0) AS total_ventas
     FROM pedido p
     LEFT JOIN detalle_pedido dp ON p.id = dp.pedido_id
     WHERE DATE(p.creado_en) BETWEEN ? AND ?
       AND p.estado_pago IN ('pagado', 'pendiente')
     GROUP BY DATE(p.creado_en)
     ORDER BY DATE(p.creado_en) ASC`,
    [fecha_inicio, fecha_fin]
  )
  return rows
}

const getProductosMasVendidos = async (fecha_inicio, fecha_fin, limit = 20) => {
  const [rows] = await db.query(
    `SELECT
       pr.id, pr.nombre AS producto,
       c.nombre AS categoria,
       SUM(dp.cantidad) AS cantidad_vendida,
       SUM(dp.subtotal) AS total_ventas,
       COUNT(DISTINCT p.id) AS veces_pedido
     FROM detalle_pedido dp
     JOIN producto pr ON dp.producto_id = pr.id
     LEFT JOIN categoria_producto c ON pr.categoria_id = c.id
     JOIN pedido p ON dp.pedido_id = p.id
     WHERE DATE(p.creado_en) BETWEEN ? AND ?
       AND p.estado_pago IN ('pagado', 'pendiente')
     GROUP BY pr.id, pr.nombre, c.nombre
     ORDER BY cantidad_vendida DESC
     LIMIT ?`,
    [fecha_inicio, fecha_fin, limit]
  )
  return rows
}

const getVentasPorCategoria = async (fecha_inicio, fecha_fin) => {
  const [rows] = await db.query(
    `SELECT
       c.nombre AS categoria,
       COUNT(DISTINCT dp.id) AS cantidad_productos,
       SUM(dp.cantidad) AS cantidad_vendida,
       SUM(dp.subtotal) AS total_ventas
     FROM detalle_pedido dp
     JOIN producto pr ON dp.producto_id = pr.id
     LEFT JOIN categoria_producto c ON pr.categoria_id = c.id
     JOIN pedido p ON dp.pedido_id = p.id
     WHERE DATE(p.creado_en) BETWEEN ? AND ?
       AND p.estado_pago IN ('pagado', 'pendiente')
     GROUP BY c.nombre
     ORDER BY total_ventas DESC`,
    [fecha_inicio, fecha_fin]
  )
  return rows
}

const getOcupacionMesas = async (fecha_inicio, fecha_fin) => {
  const [rows] = await db.query(
    `SELECT
       m.id, m.numero, m.capacidad,
       COUNT(DISTINCT p.id) AS total_pedidos,
       COALESCE(SUM(dp.subtotal), 0) AS total_ventas_mesa
     FROM mesa m
     LEFT JOIN pedido p ON p.mesa_id = m.id AND DATE(p.creado_en) BETWEEN ? AND ?
     LEFT JOIN detalle_pedido dp ON dp.pedido_id = p.id
     GROUP BY m.id, m.numero, m.capacidad
     ORDER BY total_pedidos DESC`,
    [fecha_inicio, fecha_fin]
  )
  return rows
}

const getRendimientoMeseros = async (fecha_inicio, fecha_fin) => {
  const [rows] = await db.query(
    `SELECT
       u.id, u.nombre, u.apellido, u.email,
       COUNT(DISTINCT p.id) AS pedidos_atendidos,
       COALESCE(SUM(dp.subtotal), 0) AS total_ventas,
       ROUND(COALESCE(SUM(dp.subtotal), 0) / NULLIF(COUNT(DISTINCT p.id), 0), 2) AS promedio_por_pedido
     FROM usuario u
     JOIN pedido p ON p.mesero_id = u.id
     LEFT JOIN detalle_pedido dp ON dp.pedido_id = p.id
     WHERE u.rol = 'mesero'
       AND DATE(p.creado_en) BETWEEN ? AND ?
       AND p.estado_pago IN ('pagado', 'pendiente')
     GROUP BY u.id, u.nombre, u.apellido, u.email
     ORDER BY total_ventas DESC`,
    [fecha_inicio, fecha_fin]
  )
  return rows
}

const getHistorialPedidos = async (fecha_inicio, fecha_fin) => {
  const [rows] = await db.query(
    `SELECT p.id, p.estado_servicio, p.estado_pago, p.creado_en,
            m.numero AS mesa_numero,
            u.nombre AS mesero_nombre,
            c.nombre AS cliente_nombre,
            COALESCE((SELECT SUM(subtotal) FROM detalle_pedido WHERE pedido_id = p.id), 0) AS total
     FROM pedido p
     LEFT JOIN mesa m ON p.mesa_id = m.id
     LEFT JOIN usuario u ON p.mesero_id = u.id
     LEFT JOIN cliente c ON p.cliente_id = c.id
     WHERE DATE(p.creado_en) BETWEEN ? AND ?
     ORDER BY p.creado_en DESC`,
    [fecha_inicio, fecha_fin]
  )
  return rows
}

const getHistorialPagos = async (fecha_inicio, fecha_fin) => {
  const [rows] = await db.query(
    `SELECT pg.id, pg.metodo, pg.monto, pg.referencia, pg.fecha,
            p.id AS pedido_id, m.numero AS mesa_numero
     FROM pago pg
     JOIN pedido p ON pg.pedido_id = p.id
     LEFT JOIN mesa m ON p.mesa_id = m.id
     WHERE DATE(pg.fecha) BETWEEN ? AND ?
     ORDER BY pg.fecha DESC`,
    [fecha_inicio, fecha_fin]
  )
  return rows
}

const getReservas = async (fecha_inicio, fecha_fin) => {
  const [rows] = await db.query(
    `SELECT r.id, r.cantidad_personas, r.fecha_hora_inicio, r.fecha_hora_fin,
            r.estado, r.observaciones, r.creado_en,
            c.nombre AS cliente_nombre, c.telefono AS cliente_telefono,
            m.numero AS mesa_numero
     FROM reserva r
     LEFT JOIN cliente c ON r.cliente_id = c.id
     LEFT JOIN mesa m ON r.mesa_id = m.id
     WHERE DATE(r.fecha_hora_inicio) BETWEEN ? AND ?
     ORDER BY r.fecha_hora_inicio ASC`,
    [fecha_inicio, fecha_fin]
  )
  return rows
}

const getCierreCaja = async (fecha) => {
  const ventas = await db.query(
    `SELECT
       COUNT(DISTINCT p.id) AS total_pedidos,
       COALESCE(SUM(dp.subtotal), 0) AS total_ventas_brutas,
       COUNT(DISTINCT CASE WHEN p.estado_pago = 'pagado' THEN p.id END) AS pedidos_pagados,
       COUNT(DISTINCT CASE WHEN p.estado_pago = 'pendiente' THEN p.id END) AS pedidos_pendientes,
       COUNT(DISTINCT CASE WHEN p.estado_pago = 'anulado' THEN p.id END) AS pedidos_anulados
     FROM pedido p
     LEFT JOIN detalle_pedido dp ON dp.pedido_id = p.id
     WHERE DATE(p.creado_en) = ?`,
    [fecha]
  )

  const pagos = await db.query(
    `SELECT pg.metodo, COALESCE(SUM(pg.monto), 0) AS total
     FROM pago pg
     JOIN pedido p ON pg.pedido_id = p.id
     WHERE DATE(pg.fecha) = ?
     GROUP BY pg.metodo`,
    [fecha]
  )

  return {
    resumen: ventas[0][0] || { total_pedidos: 0, total_ventas_brutas: 0, pedidos_pagados: 0, pedidos_pendientes: 0, pedidos_anulados: 0 },
    pagos_por_metodo: pagos[0]
  }
}

module.exports = {
  createReport,
  getReports,
  findReportById,
  deleteReport,
  getVentasDiarias,
  getVentasPeriodo,
  getProductosMasVendidos,
  getVentasPorCategoria,
  getOcupacionMesas,
  getRendimientoMeseros,
  getHistorialPedidos,
  getHistorialPagos,
  getReservas,
  getCierreCaja
}
