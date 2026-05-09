const {
  getOrders,
  getOrderItems,
  createOrder,
  createOrderDetail,
  updateOrderStatus,
  findOrderById,
  getWeeklySales,
  getSalesByCategory,
  getTodaySales
} = require("../models/orderModels")

const mapKitchenStatus = (estado_cocina) => {
  const map = {
    abierto: "pending",
    cocina: "preparing",
    listo: "ready",
    servido: "delivered"
  }
  return map[estado_cocina] || "pending"
}

const getAllOrders = async (req, res) => {
  try {
    const orders = await getOrders()
    const orderIds = orders.map((order) => order.id)
    const orderItems = await getOrderItems(orderIds)
    const groupedItems = orderItems.reduce((acc, item) => {
      if (!acc[item.pedido_id]) acc[item.pedido_id] = []
      acc[item.pedido_id].push({
        name: item.plato_nombre,
        qty: item.cantidad,
        price: Number(item.precio_momento),
        notes: item.notas
      })
      return acc
    }, {})

    const mapped = orders.map((order) => ({
      id: order.id,
      table: order.mesa_nombre || order.mesa_id,
      waiter: order.mesero_nombre ? `${order.mesero_nombre} ${order.mesero_apellido || ""}`.trim() : "Sin asignar",
      time: order.time,
      status: mapKitchenStatus(order.estado_cocina),
      subtotal: Number(order.subtotal),
      impuesto: Number(order.impuesto),
      propina: Number(order.propina),
      total: Number(order.total),
      paymentStatus: order.estado_pago,
      items: groupedItems[order.id] || []
    }))

    res.json(mapped)
  } catch (error) {
    console.error(error)
    res.status(500).json({ message: "Error al recuperar los pedidos" })
  }
}

const createNewOrder = async (req, res) => {
  const { mesa_id, usuario_id = null, items, propina = 0 } = req.body

  if (!mesa_id || !Array.isArray(items) || items.length === 0) {
    return res.status(400).json({ message: "Mesa y items son obligatorios" })
  }

  try {
    const subtotal = items.reduce((sum, item) => sum + Number(item.price) * Number(item.qty), 0)
    const parsedPropina = Number(propina) || 0
    const impuesto = parseFloat((subtotal * 0.13).toFixed(2))
    const total = parseFloat((subtotal + impuesto + parsedPropina).toFixed(2))
    const orderId = await createOrder(mesa_id, usuario_id, subtotal, impuesto, parsedPropina, total)

    for (const item of items) {
      await createOrderDetail(orderId, item.plato_id, item.qty, item.price, item.notes || null)
    }

    res.status(201).json({ id: orderId, message: "Pedido creado correctamente" })
  } catch (error) {
    console.error(error)
    res.status(500).json({ message: "Error al crear el pedido" })
  }
}

const updateExistingOrderStatus = async (req, res) => {
  const { id } = req.params
  const { status } = req.body

  if (!status) {
    return res.status(400).json({ message: "Estado de pedido es obligatorio" })
  }

  const statusMap = {
    pending: "abierto",
    preparing: "cocina",
    ready: "listo",
    delivered: "servido"
  }

  const estado_cocina = statusMap[status] || status

  try {
    const existing = await findOrderById(id)
    if (!existing) {
      return res.status(404).json({ message: "Pedido no encontrado" })
    }

    await updateOrderStatus(id, estado_cocina)
    res.json({ message: "Estado del pedido actualizado" })
  } catch (error) {
    console.error(error)
    res.status(500).json({ message: "Error al actualizar el pedido" })
  }
}

const getSalesStats = async (req, res) => {
  try {
    const weeklyRows = await getWeeklySales()
    const categoryRows = await getSalesByCategory()
    const today = await getTodaySales()

    const dayNames = { Monday: 'Lun', Tuesday: 'Mar', Wednesday: 'Mié', Thursday: 'Jue', Friday: 'Vie', Saturday: 'Sáb', Sunday: 'Dom' }
    const dayOrder = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom']

    const weekly = dayOrder.map(day => {
      const found = weeklyRows.find(r => dayNames[r.dia_nombre] === day)
      return { day, sales: found ? Number(found.total_ventas) : 0 }
    })

    const categories = categoryRows.map(r => ({
      name: r.categoria,
      value: Number(r.total_ventas)
    }))

    const categoryNames = ['Platos', 'Bebidas', 'Postres', 'Entradas']
    categoryNames.forEach(name => {
      if (!categories.find(c => c.name === name)) {
        categories.push({ name, value: 0 })
      }
    })

    res.json({
      weekly,
      categories: categories.slice(0, 4),
      today: {
        orders: Number(today.cantidad_pedidos),
        sales: Number(today.total_ventas),
        avgTicket: Number(today.ticket_promedio)
      }
    })
  } catch (error) {
    console.error(error)
    res.status(500).json({ message: "Error al obtener estadisticas" })
  }
}

module.exports = {
  getAllOrders,
  createNewOrder,
  updateExistingOrderStatus,
  getSalesStats
}
