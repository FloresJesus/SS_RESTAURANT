const db = require("../config/db")

const getOrders = async () => {
  const [rows] = await db.query(
    `SELECT
      p.id,
      p.reservacion_id,
      p.mesa_id,
      m.nombre AS mesa_nombre,
      p.subtotal,
      p.impuesto,
      p.propina,
      p.total,
      p.estado_cocina,
      p.estado_pago,
      DATE_FORMAT(p.creado_en, '%H:%i') AS time,
      u.nombre AS mesero_nombre,
      u.apellido AS mesero_apellido,
      c.nombre AS cliente_nombre
    FROM pedido p
    LEFT JOIN mesa m ON p.mesa_id = m.id
    LEFT JOIN usuario u ON p.usuario_id = u.id
    LEFT JOIN reservacion r ON p.reservacion_id = r.id
    LEFT JOIN cliente c ON r.cliente_id = c.id
    ORDER BY p.creado_en DESC`
  )
  return rows
}

const getOrderItems = async (orderIds) => {
  if (!orderIds || orderIds.length === 0) {
    return []
  }

  const [rows] = await db.query(
    `SELECT
       pd.pedido_id,
       pd.cantidad,
       pd.precio_momento,
       pd.notas,
       pl.nombre AS plato_nombre
     FROM pedido_detalle pd
     JOIN plato pl ON pd.plato_id = pl.id
     WHERE pd.pedido_id IN (?)`,
    [orderIds]
  )

  return rows
}

const createOrder = async (
  mesa_id,
  usuario_id = null,
  subtotal,
  impuesto,
  propina,
  total,
  estado_cocina = "abierto",
  estado_pago = "pendiente"
) => {
  const [result] = await db.query(
    `INSERT INTO pedido (mesa_id, usuario_id, subtotal, impuesto, propina, total, estado_cocina, estado_pago)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [mesa_id, usuario_id, subtotal, impuesto, propina, total, estado_cocina, estado_pago]
  )
  return result.insertId
}

const createOrderDetail = async (pedido_id, plato_id, cantidad, precio_momento, notas = null) => {
  const [result] = await db.query(
    `INSERT INTO pedido_detalle (pedido_id, plato_id, cantidad, precio_momento, notas)
     VALUES (?, ?, ?, ?, ?)`,
    [pedido_id, plato_id, cantidad, precio_momento, notas]
  )
  return result
}

const updateOrderStatus = async (id, estado_cocina) => {
  const [result] = await db.query(
    `UPDATE pedido SET estado_cocina = ? WHERE id = ?`,
    [estado_cocina, id]
  )
  return result
}

const findOrderById = async (id) => {
  const [rows] = await db.query(
    `SELECT * FROM pedido WHERE id = ?`,
    [id]
  )
  return rows[0]
}

const getWeeklySales = async () => {
  const [rows] = await db.query(
    `SELECT 
      DATE(p.creado_en) as fecha,
      DAYNAME(p.creado_en) as dia_nombre,
      SUM(p.total) as total_ventas,
      COUNT(p.id) as cantidad_pedidos
    FROM pedido p
    WHERE p.creado_en >= DATE_SUB(CURDATE(), INTERVAL 6 DAY)
    AND p.estado_cocina = 'servido'
    GROUP BY DATE(p.creado_en), DAYNAME(p.creado_en)
    ORDER BY DATE(p.creado_en) ASC`
  )
  return rows
}

const getSalesByCategory = async () => {
  const [rows] = await db.query(
    `SELECT 
      pl.categoria,
      COUNT(*) as cantidad,
      SUM(pd.precio_momento * pd.cantidad) as total_ventas
    FROM pedido_detalle pd
    JOIN plato pl ON pd.plato_id = pl.id
    JOIN pedido p ON pd.pedido_id = p.id
    WHERE p.creado_en >= DATE_SUB(CURDATE(), INTERVAL 7 DAY)
    AND p.estado_cocina = 'servido'
    GROUP BY pl.categoria
    ORDER BY total_ventas DESC`
  )
  return rows
}

const getTodaySales = async () => {
  const [rows] = await db.query(
    `SELECT 
      COUNT(*) as cantidad_pedidos,
      COALESCE(SUM(p.total), 0) as total_ventas,
      COALESCE(AVG(p.total), 0) as ticket_promedio
    FROM pedido p
    WHERE DATE(p.creado_en) = CURDATE()
    AND p.estado_cocina = 'servido'`
  )
  return rows[0]
}

module.exports = {
  getOrders,
  getOrderItems,
  createOrder,
  createOrderDetail,
  updateOrderStatus,
  findOrderById,
  getWeeklySales,
  getSalesByCategory,
  getTodaySales
}
