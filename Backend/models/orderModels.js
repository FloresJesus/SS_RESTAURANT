const db = require("../config/db")

const getOrders = async () => {
  const [rows] = await db.query(
    `SELECT p.id, p.cliente_id, p.reserva_id, p.mesa_id, p.mesero_id,
            p.estado_servicio, p.estado_pago, p.observaciones, p.creado_en,
            pg.metodo AS metodo_pago,
            m.numero AS mesa_numero,
            u.nombre AS mesero_nombre, u.apellido AS mesero_apellido,
            c.nombre AS cliente_nombre
     FROM pedido p
     LEFT JOIN mesa m ON p.mesa_id = m.id
     LEFT JOIN usuario u ON p.mesero_id = u.id
     LEFT JOIN cliente c ON p.cliente_id = c.id
     LEFT JOIN pago pg ON pg.id = (SELECT MAX(id) FROM pago WHERE pedido_id = p.id)
     ORDER BY p.creado_en DESC`
  )
  return rows
}

const getOrderDetails = async (pedidoId) => {
  const [rows] = await db.query(
    `SELECT dp.id, dp.pedido_id, dp.producto_id, dp.cantidad,
            dp.precio_unitario, dp.subtotal, dp.estado, dp.observaciones,
            pr.nombre AS producto_nombre, pr.descripcion AS producto_descripcion
     FROM detalle_pedido dp
     JOIN producto pr ON dp.producto_id = pr.id
     WHERE dp.pedido_id = ?
     ORDER BY dp.id`,
    [pedidoId]
  )
  return rows
}

const getOrdersWithDetails = async () => {
  const orders = await getOrders()
  const result = []
  
  for (const order of orders) {
    const details = await getOrderDetails(order.id)
    const subtotal = details.reduce((sum, d) => sum + parseFloat(d.subtotal), 0)
    result.push({
      ...order,
      detalles: details,
      subtotal: subtotal
    })
  }
  
  return result
}

const findOrderById = async (id) => {
  const [rows] = await db.query(
    `SELECT p.id, p.cliente_id, p.reserva_id, p.mesa_id, p.mesero_id,
            p.estado_servicio, p.estado_pago, p.observaciones, p.creado_en,
            pg.metodo AS metodo_pago,
            m.numero AS mesa_numero,
            u.nombre AS mesero_nombre, u.apellido AS mesero_apellido,
            c.nombre AS cliente_nombre,
            r.id AS reserva_id, r.estado AS reserva_estado
     FROM pedido p
     LEFT JOIN mesa m ON p.mesa_id = m.id
     LEFT JOIN usuario u ON p.mesero_id = u.id
     LEFT JOIN cliente c ON p.cliente_id = c.id
     LEFT JOIN reserva r ON p.reserva_id = r.id
     LEFT JOIN pago pg ON pg.id = (SELECT MAX(id) FROM pago WHERE pedido_id = p.id)
     WHERE p.id = ?`,
    [id]
  )
  return rows[0]
}

const createOrder = async (cliente_id, reserva_id, mesa_id, mesero_id, observaciones = null) => {
  const [result] = await db.query(
    `INSERT INTO pedido (cliente_id, reserva_id, mesa_id, mesero_id, observaciones)
     VALUES (?, ?, ?, ?, ?)`,
    [cliente_id, reserva_id, mesa_id, mesero_id, observaciones]
  )
  return result.insertId
}

const createOrderDetail = async (pedido_id, producto_id, cantidad, precio_unitario, observaciones = null) => {
  const subtotal = cantidad * precio_unitario
  const [result] = await db.query(
    `INSERT INTO detalle_pedido (pedido_id, producto_id, cantidad, precio_unitario, subtotal, observaciones)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [pedido_id, producto_id, cantidad, precio_unitario, subtotal, observaciones]
  )
  return result
}

const updateOrderDetail = async (id, cantidad, observaciones = null) => {
  const [detail] = await db.query(
    `SELECT precio_unitario FROM detalle_pedido WHERE id = ?`,
    [id]
  )
  if (!detail[0]) throw new Error('Detalle no encontrado')
  
  const subtotal = cantidad * detail[0].precio_unitario
  const [result] = await db.query(
    `UPDATE detalle_pedido
     SET cantidad = ?, subtotal = ?, observaciones = ?
     WHERE id = ?`,
    [cantidad, subtotal, observaciones, id]
  )
  return result
}

const deleteOrderDetail = async (id) => {
  const [result] = await db.query(
    `DELETE FROM detalle_pedido WHERE id = ?`,
    [id]
  )
  return result
}

const updateOrderServiceStatus = async (id, estado_servicio) => {
  const validStates = ['pendiente', 'preparando', 'listo', 'entregado', 'cancelado']
  if (!validStates.includes(estado_servicio)) {
    throw new Error('Estado de servicio invalido')
  }
  const [result] = await db.query(
    `UPDATE pedido SET estado_servicio = ? WHERE id = ?`,
    [estado_servicio, id]
  )
  return result
}

const updateOrderPaymentStatus = async (id, estado_pago) => {
  const validStates = ['pendiente', 'pagado', 'anulado']
  if (!validStates.includes(estado_pago)) {
    throw new Error('Estado de pago invalido')
  }
  const [result] = await db.query(
    `UPDATE pedido SET estado_pago = ? WHERE id = ?`,
    [estado_pago, id]
  )
  return result
}

const updateOrder = async (id, observaciones) => {
  const [result] = await db.query(
    `UPDATE pedido SET observaciones = ? WHERE id = ?`,
    [observaciones, id]
  )
  return result
}

const deleteOrder = async (id) => {
  const [result] = await db.query(
    `DELETE FROM pedido WHERE id = ?`,
    [id]
  )
  return result
}

const getOrdersByDate = async (fecha) => {
  const [rows] = await db.query(
    `SELECT p.id, p.cliente_id, p.reserva_id, p.mesa_id, p.mesero_id,
            p.estado_servicio, p.estado_pago, p.observaciones, p.creado_en,
            pg.metodo AS metodo_pago,
            m.numero AS mesa_numero,
            u.nombre AS mesero_nombre, u.apellido AS mesero_apellido,
            c.nombre AS cliente_nombre
     FROM pedido p
     LEFT JOIN mesa m ON p.mesa_id = m.id
     LEFT JOIN usuario u ON p.mesero_id = u.id
     LEFT JOIN cliente c ON p.cliente_id = c.id
     LEFT JOIN pago pg ON pg.id = (SELECT MAX(id) FROM pago WHERE pedido_id = p.id)
     WHERE DATE(p.creado_en) = ?
     ORDER BY p.creado_en DESC`,
    [fecha]
  )
  return rows
}

const getOrdersByStatus = async (estado_servicio) => {
  const [rows] = await db.query(
    `SELECT p.id, p.cliente_id, p.reserva_id, p.mesa_id, p.mesero_id,
            p.estado_servicio, p.estado_pago, p.observaciones, p.creado_en,
            pg.metodo AS metodo_pago,
            m.numero AS mesa_numero,
            u.nombre AS mesero_nombre, u.apellido AS mesero_apellido,
            c.nombre AS cliente_nombre
     FROM pedido p
     LEFT JOIN mesa m ON p.mesa_id = m.id
     LEFT JOIN usuario u ON p.mesero_id = u.id
     LEFT JOIN cliente c ON p.cliente_id = c.id
     LEFT JOIN pago pg ON pg.id = (SELECT MAX(id) FROM pago WHERE pedido_id = p.id)
     WHERE p.estado_servicio = ?
     ORDER BY p.creado_en DESC`,
    [estado_servicio]
  )
  return rows
}

const getOrderTotal = async (pedidoId) => {
  const [rows] = await db.query(
    `SELECT COALESCE(SUM(subtotal), 0) AS total
     FROM detalle_pedido
     WHERE pedido_id = ?`,
    [pedidoId]
  )
  return parseFloat(rows[0].total)
}

const getDailySales = async () => {
  const [rows] = await db.query(
    `SELECT 
       DATE(p.creado_en) AS fecha,
       COUNT(p.id) AS cantidad_pedidos,
       COALESCE(SUM(dp.subtotal), 0) AS subtotal_ventas
     FROM pedido p
     LEFT JOIN detalle_pedido dp ON p.id = dp.pedido_id
     WHERE DATE(p.creado_en) = CURDATE()
     AND p.estado_pago = 'pagado'
     GROUP BY DATE(p.creado_en)`
  )
  return rows[0] || { fecha: new Date().toISOString().split('T')[0], cantidad_pedidos: 0, subtotal_ventas: 0 }
}

const getWeeklySales = async () => {
  const [rows] = await db.query(
    `SELECT 
       DATE(p.creado_en) AS fecha,
       DAYNAME(p.creado_en) AS dia_nombre,
       COALESCE(SUM(dp.subtotal), 0) AS total_ventas,
       COUNT(DISTINCT p.id) AS cantidad_pedidos
     FROM pedido p
     LEFT JOIN detalle_pedido dp ON p.id = dp.pedido_id
     WHERE p.creado_en >= DATE_SUB(CURDATE(), INTERVAL 6 DAY)
     AND p.estado_pago = 'pagado'
     GROUP BY DATE(p.creado_en), DAYNAME(p.creado_en)
     ORDER BY DATE(p.creado_en) ASC`
  )
  return rows
}

const getTopSellingProducts = async (limit = 10) => {
  const [rows] = await db.query(
    `SELECT 
       pr.id, pr.nombre,
       c.nombre AS categoria_nombre,
       SUM(dp.cantidad) AS cantidad_vendida,
       SUM(dp.subtotal) AS total_ventas
     FROM detalle_pedido dp
     JOIN producto pr ON dp.producto_id = pr.id
     LEFT JOIN categoria_producto c ON pr.categoria_id = c.id
     JOIN pedido p ON dp.pedido_id = p.id
     WHERE p.creado_en >= DATE_SUB(CURDATE(), INTERVAL 7 DAY)
     AND p.estado_pago = 'pagado'
     GROUP BY pr.id, pr.nombre, c.nombre
     ORDER BY cantidad_vendida DESC
     LIMIT ?`,
    [limit]
  )
  return rows
}

const getSalesByCategory = async () => {
  const [rows] = await db.query(
    `SELECT 
       c.nombre AS categoria,
       COALESCE(SUM(dp.subtotal), 0) AS total_ventas
     FROM detalle_pedido dp
     JOIN producto pr ON dp.producto_id = pr.id
     LEFT JOIN categoria_producto c ON pr.categoria_id = c.id
     JOIN pedido p ON dp.pedido_id = p.id
     WHERE DATE(p.creado_en) = CURDATE()
     AND p.estado_pago = 'pagado'
     GROUP BY c.nombre
     ORDER BY total_ventas DESC`
  )
  return rows
}

module.exports = {
  getOrders,
  getOrderDetails,
  getOrdersWithDetails,
  findOrderById,
  createOrder,
  createOrderDetail,
  updateOrderDetail,
  deleteOrderDetail,
  updateOrderServiceStatus,
  updateOrderPaymentStatus,
  updateOrder,
  deleteOrder,
  getOrdersByDate,
  getOrdersByStatus,
  getOrderTotal,
  getDailySales,
  getWeeklySales,
  getTopSellingProducts,
  getSalesByCategory
}
