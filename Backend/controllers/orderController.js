const db = require("../config/db")
const { logAudit } = require("../utils/auditLogger")
const {
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
  getOrdersByDate,
  getOrdersByStatus,
  getOrderTotal,
  getDailySales,
  getWeeklySales,
  getMonthlySales,
  getTopSellingProducts,
  getSalesByCategory
} = require("../models/orderModels")
const { updateTableStatus, findTableById } = require("../models/tableModels")
const { createNotification } = require("../models/notificationModel")

const mapServiceStatus = (estado_servicio) => {
  const map = {
    pendiente: "pending",
    preparando: "preparing",
    listo: "ready",
    entregado: "delivered",
    cancelado: "cancelled"
  }
  return map[estado_servicio] || "pending"
}

const reverseMapServiceStatus = (status) => {
  const map = {
    pending: "pendiente",
    preparing: "preparando",
    ready: "listo",
    delivered: "entregado",
    cancelled: "cancelado"
  }
  return map[status] || status
}

const getAllOrders = async (req, res) => {
  try {
    const orders = await getOrdersWithDetails()
    const mapped = orders.map((order) => ({
      id: order.id,
      mesa_id: order.mesa_id,
      mesa_numero: order.mesa_numero,
      cliente_id: order.cliente_id,
      cliente_nombre: order.cliente_nombre,
      reserva_id: order.reserva_id,
      mesero_id: order.mesero_id,
      mesero_nombre: order.mesero_nombre ? `${order.mesero_nombre} ${order.mesero_apellido || ""}`.trim() : null,
      estado_servicio: order.estado_servicio,
      estado_pago: order.estado_pago,
      metodo_pago: order.metodo_pago,
      observaciones: order.observaciones,
      subtotal: order.subtotal,
      total: order.subtotal,
      time: new Date(order.creado_en).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' }),
      creado_en: order.creado_en,
      status: mapServiceStatus(order.estado_servicio),
      items: order.detalles.map((d) => ({
        id: d.id,
        producto_id: d.producto_id,
        nombre: d.producto_nombre,
        cantidad: d.cantidad,
        precio_unitario: Number(d.precio_unitario),
        subtotal: Number(d.subtotal),
        estado: d.estado,
        observaciones: d.observaciones
      }))
    }))

    res.json(mapped)
  } catch (error) {
    console.error("Error al recuperar los pedidos:", error)
    res.status(500).json({ message: "Error al recuperar los pedidos" })
  }
}

const getOrderById = async (req, res) => {
  const { id } = req.params

  try {
    const order = await findOrderById(id)
    if (!order) {
      return res.status(404).json({ message: "Pedido no encontrado" })
    }

    const details = await getOrderDetails(id)
    const subtotal = details.reduce((sum, d) => sum + parseFloat(d.subtotal), 0)

    res.json({
      ...order,
      subtotal,
      total: subtotal,
      status: mapServiceStatus(order.estado_servicio),
      items: details.map((d) => ({
        id: d.id,
        producto_id: d.producto_id,
        nombre: d.producto_nombre,
        cantidad: d.cantidad,
        precio_unitario: Number(d.precio_unitario),
        subtotal: Number(d.subtotal),
        estado: d.estado,
        observaciones: d.observaciones
      }))
    })
  } catch (error) {
    console.error("Error al recuperar el pedido:", error)
    res.status(500).json({ message: "Error al recuperar el pedido" })
  }
}

const createNewOrder = async (req, res) => {
  const { mesa_id, cliente_id = null, reserva_id = null, mesero_id, items = [], observaciones = null, metodo_pago = null } = req.body

  if (!mesa_id || !mesero_id) {
    return res.status(400).json({ message: "Mesa y mesero son obligatorios" })
  }

  if (!items || items.length === 0) {
    return res.status(400).json({ message: "Al menos un producto es obligatorio" })
  }

  const connection = await db.getConnection()

  try {
    await connection.beginTransaction()

    const [tableData] = await connection.query(
      `SELECT id, estado FROM mesa WHERE id = ?`,
      [mesa_id]
    )
    if (!tableData[0]) {
      throw new Error("Mesa no encontrada")
    }

    let effectiveReservaId = reserva_id
    let effectiveClienteId = cliente_id

    if (!effectiveReservaId) {
      const [reservasHoy] = await connection.query(
         `SELECT id, cliente_id FROM reserva
          WHERE mesa_id = ? AND DATE(fecha_hora_inicio) = CURDATE()
          AND estado IN ('confirmada', 'pendiente')
          ORDER BY estado = 'confirmada' DESC, fecha_hora_inicio ASC
          LIMIT 1`,
        [mesa_id]
      )
      if (reservasHoy[0]) {
        effectiveReservaId = reservasHoy[0].id
        if (!effectiveClienteId && reservasHoy[0].cliente_id) {
          effectiveClienteId = reservasHoy[0].cliente_id
        }
      }
    }

    const [result] = await connection.query(
      `INSERT INTO pedido (cliente_id, reserva_id, mesa_id, mesero_id, observaciones)
       VALUES (?, ?, ?, ?, ?)`,
      [effectiveClienteId, effectiveReservaId, mesa_id, mesero_id, observaciones]
    )
    const orderId = result.insertId

    if (effectiveReservaId) {
      await connection.query(
        `UPDATE reserva SET estado = 'completada' WHERE id = ? AND estado != 'completada'`,
        [effectiveReservaId]
      )
    }

    let total = 0
    for (const item of items) {
      if (!item.producto_id || !item.cantidad) continue

      const [productData] = await connection.query(
        `SELECT precio FROM producto WHERE id = ?`,
        [item.producto_id]
      )
      if (!productData[0]) continue

      const precioUnitario = item.precio_unitario || productData[0].precio
      const subtotal = item.cantidad * precioUnitario
      total += subtotal

      await connection.query(
        `INSERT INTO detalle_pedido (pedido_id, producto_id, cantidad, precio_unitario, subtotal, observaciones)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [orderId, item.producto_id, item.cantidad, precioUnitario, subtotal, item.observaciones || null]
      )
    }

    if (metodo_pago) {
      const validMethods = ['efectivo', 'tarjeta', 'qr', 'transferencia']
      if (!validMethods.includes(metodo_pago)) {
        throw new Error('Metodo de pago invalido')
      }
      await connection.query(
        `INSERT INTO pago (pedido_id, metodo, monto) VALUES (?, ?, ?)`,
        [orderId, metodo_pago, total]
      )
      await connection.query(
        `UPDATE pedido SET estado_pago = 'pagado' WHERE id = ?`,
        [orderId]
      )
    }

    await connection.query(
      `UPDATE mesa SET estado = 'ocupada' WHERE id = ?`,
      [mesa_id]
    )

    await connection.commit()

    await logAudit(req.user.id, 'CREAR', 'pedidos', orderId, `Pedido ${orderId} creado en mesa ${mesa_id}`, req.ip)
    res.status(201).json({
      id: orderId,
      message: "Pedido creado correctamente"
    })
  } catch (error) {
    await connection.rollback()
    console.error("Error al crear el pedido:", error)
    res.status(500).json({ message: "Error al crear el pedido" })
  } finally {
    connection.release()
  }
}

const updateOrderItems = async (req, res) => {
  const { id } = req.params
  const { items = [] } = req.body

  if (!items || items.length === 0) {
    return res.status(400).json({ message: "Al menos un producto es obligatorio" })
  }

  const connection = await db.getConnection()

  try {
    await connection.beginTransaction()

    const [orderData] = await connection.query(
      `SELECT id FROM pedido WHERE id = ?`,
      [id]
    )
    if (!orderData[0]) {
      throw new Error("Pedido no encontrado")
    }

    for (const item of items) {
      if (!item.producto_id || !item.cantidad) continue

      if (item.id) {
        const [currentDetail] = await connection.query(
          `SELECT precio_unitario FROM detalle_pedido WHERE id = ? AND pedido_id = ?`,
          [item.id, id]
        )
        if (currentDetail[0]) {
          const subtotal = item.cantidad * currentDetail[0].precio_unitario
          await connection.query(
            `UPDATE detalle_pedido SET cantidad = ?, subtotal = ? WHERE id = ?`,
            [item.cantidad, subtotal, item.id]
          )
        }
      } else {
        const [productData] = await connection.query(
          `SELECT precio FROM producto WHERE id = ?`,
          [item.producto_id]
        )
        if (productData[0]) {
          const precioUnitario = item.precio_unitario || productData[0].precio
          const subtotal = item.cantidad * precioUnitario
          await connection.query(
            `INSERT INTO detalle_pedido (pedido_id, producto_id, cantidad, precio_unitario, subtotal, observaciones)
             VALUES (?, ?, ?, ?, ?, ?)`,
            [id, item.producto_id, item.cantidad, precioUnitario, subtotal, item.observaciones || null]
          )
        }
      }
    }

    await connection.commit()
    await logAudit(req.user.id, 'ACTUALIZAR', 'pedidos', Number(id), `Items del pedido ${id} actualizados`, req.ip)
    res.json({ message: "Items del pedido actualizados correctamente" })
  } catch (error) {
    await connection.rollback()
    console.error("Error al actualizar items del pedido:", error)
    res.status(500).json({ message: "Error al actualizar items del pedido" })
  } finally {
    connection.release()
  }
}

const deleteOrderItem = async (req, res) => {
  const { id, itemId } = req.params

  try {
    const result = await deleteOrderDetail(itemId)
    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "Item no encontrado" })
    }
    await logAudit(req.user.id, 'ELIMINAR', 'detalle_pedido', Number(itemId), `Item ${itemId} eliminado del pedido ${id}`, req.ip)
    res.json({ message: "Item eliminado del pedido correctamente" })
  } catch (error) {
    console.error("Error al eliminar item del pedido:", error)
    res.status(500).json({ message: "Error al eliminar item del pedido" })
  }
}

const updateOrderStatus = async (req, res) => {
  const { id } = req.params
  const { status } = req.body

  if (!status) {
    return res.status(400).json({ message: "Estado es obligatorio" })
  }

  const estado_servicio = reverseMapServiceStatus(status)

  const connection = await db.getConnection()

  try {
    await connection.beginTransaction()

    const [orderData] = await connection.query(
      `SELECT id, mesa_id, estado_servicio FROM pedido WHERE id = ?`,
      [id]
    )
    if (!orderData[0]) {
      throw new Error("Pedido no encontrado")
    }

    await connection.query(
      `UPDATE pedido SET estado_servicio = ? WHERE id = ?`,
      [estado_servicio, id]
    )

    if (estado_servicio === 'cancelado' || estado_servicio === 'entregado') {
      await connection.query(
        `UPDATE mesa SET estado = 'libre' WHERE id = ?`,
        [orderData[0].mesa_id]
      )
    }

    await connection.commit()

    const titulos = { pending: 'Nuevo Pedido', preparing: 'Pedido en Preparacion', ready: 'Pedido Listo', delivered: 'Pedido Entregado' }
    const mensajes = { pending: `Pedido #${id} registrado`, preparing: `Pedido #${id} esta siendo preparado`, ready: `Pedido #${id} esta listo para entregar`, delivered: `Pedido #${id} ha sido entregado` }
    const destinos = { pending: 'cocina', preparing: 'cocina', ready: 'mesero', delivered: 'admin' }

    try {
      await createNotification({
        tipo: `order_${status}`,
        titulo: titulos[status] || 'Pedido Actualizado',
        mensaje: mensajes[status] || `Pedido #${id} cambio a ${status}`,
        referencia_id: Number(id),
        referencia_tipo: 'order',
        usuario_destino: destinos[status] || null
      })
    } catch (notifErr) {
      console.error("Error creando notificacion:", notifErr)
    }

    await logAudit(req.user.id, 'ACTUALIZAR', 'pedidos', Number(id), `Estado pedido ${id} cambiado a ${status}`, req.ip)
    res.json({ message: "Estado del pedido actualizado" })
  } catch (error) {
    await connection.rollback()
    console.error("Error al actualizar el estado del pedido:", error)
    res.status(500).json({ message: "Error al actualizar el estado del pedido" })
  } finally {
    connection.release()
  }
}

function toLocalDate(dateStr) {
  const [y, m, d] = dateStr.split('-').map(Number)
  return new Date(y, m - 1, d)
}

function formatLocalDate(date) {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

const daysOfWeek = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb']

const getSalesStats = async (req, res) => {
  try {
    const { range } = req.query
    const topProducts = await getTopSellingProducts(5)
    const todayData = await getDailySales()
    const categoryData = await getSalesByCategory()

    let weekly = []

    if (range === 'month') {
      const monthlyRows = await getMonthlySales()

      weekly = monthlyRows.map(r => {
        const d = toLocalDate(r.fecha)
        return {
          day: String(d.getDate()),
          sales: parseFloat(r.total_ventas),
          date: r.fecha
        }
      })

      const latestDate = weekly.length > 0
        ? weekly.reduce((a, b) => a.date > b.date ? a : b).date
        : formatLocalDate(new Date())

      const ref = toLocalDate(latestDate)
      const year = ref.getFullYear()
      const month = ref.getMonth()
      const daysInMonth = new Date(year, month + 1, 0).getDate()

      for (let day = 1; day <= daysInMonth; day++) {
        const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
        if (!weekly.find(w => w.date === dateStr)) {
          weekly.push({
            day: String(day),
            sales: 0,
            date: dateStr
          })
        }
      }
    } else {
      const weeklyRows = await getWeeklySales()

      weekly = weeklyRows.map(r => ({
        day: daysOfWeek[toLocalDate(r.fecha).getDay()],
        sales: parseFloat(r.total_ventas),
        date: r.fecha
      }))

      const latestDate = weekly.length > 0
        ? weekly.reduce((a, b) => a.date > b.date ? a : b).date
        : formatLocalDate(new Date())

      const refDate = toLocalDate(latestDate)
      for (let i = 6; i >= 0; i--) {
        const d = new Date(refDate)
        d.setDate(d.getDate() - i)
        const dateStr = formatLocalDate(d)
        if (!weekly.find(w => w.date === dateStr)) {
          weekly.push({
            day: daysOfWeek[d.getDay()],
            sales: 0,
            date: dateStr
          })
        }
      }
    }

    weekly.sort((a, b) => a.date.localeCompare(b.date))

    const products = topProducts.map(p => ({
      name: p.nombre,
      quantity: Number(p.cantidad_vendida),
      value: parseFloat(p.total_ventas)
    }))

    const categories = categoryData.map(c => ({
      categoria: c.categoria || 'Sin categoria',
      total_ventas: parseFloat(c.total_ventas)
    }))

    res.json({
      weekly,
      topProducts: products,
      today: {
        orders: Number(todayData.cantidad_pedidos),
        sales: parseFloat(todayData.subtotal_ventas)
      },
      categories
    })
  } catch (error) {
    console.error("Error al obtener estadisticas:", error)
    res.status(500).json({ message: "Error al obtener estadisticas" })
  }
}

module.exports = {
  getAllOrders,
  getOrderById,
  createNewOrder,
  updateOrderItems,
  deleteOrderItem,
  updateOrderStatus,
  getSalesStats
}
