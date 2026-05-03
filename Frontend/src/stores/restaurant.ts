import { defineStore } from 'pinia'
import { ref } from 'vue'

const API_BASE = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:3000/api'

const fetchJson = async (url: string, options: RequestInit = {}) => {
  const response = await fetch(url, options)
  if (!response.ok) {
    const error = await response.text()
    throw new Error(error || response.statusText)
  }
  return response.json()
}

export const useRestaurantStore = defineStore('restaurant', () => {
  const menuItems = ref([
    { id: 0, name: 'Lomo Saltado', category: 'Platos Principales', price: 0, description: 'Carne salteada con cebolla, tomate y papas fritas.', available: true, imagen: null },
    { id: 0, name: 'Ceviche Mixto', category: 'Entradas', price: 0, description: 'Pescado y mariscos en salsa de limón y ají.', available: true, imagen: null },
    { id: 0, name: 'Tiradito', category: 'Entradas', price: 0, description: 'Filete de pescado en salsa de ají amarillo y leche de tigre.', available: true, imagen: null },
    { id: 0, name: 'Suspiro Limeño', category: 'Postres', price: 0, description: 'Dulce de leche con merengue y canela.', available: true, imagen: null },
    { id: 0, name: 'Limonada', category: 'Bebidas', price: 0, description: 'Refrescante limonada con hierbabuena.', available: true, imagen: null }
  ])

  const orders = ref([
    { id: 0, table: 'A1', waiter: 'Luis', time: '00:00', status: 'pending', total: 0, items: [ { name: 'Lomo Saltado', qty: 0, price: 0 }, { name: 'Limonada', qty: 0, price: 0 } ] },
    { id: 0, table: 'B3', waiter: 'María', time: '00:00', status: 'preparing', total: 0, items: [ { name: 'Ceviche Mixto', qty: 0, price: 0 }, { name: 'Tiradito', qty: 0, price: 0 }, { name: 'Limonada', qty: 0, price: 0 } ] }
  ])

  const tables = ref([
    { id: 0, number: 'A1', capacity: 4, status: 'available', reservation: null },
    { id: 1, number: 'B2', capacity: 2, status: 'occupied', reservation: null },
    { id: 2, number: 'C3', capacity: 5, status: 'reserved', reservation: { name: 'Lucía', time: '20:00', guests: 3 } },
    { id: 3, number: 'D4', capacity: 6, status: 'available', reservation: null }
  ])

  const reservations = ref([
    { id: 0, name: 'Lucía', phone: '555-1234', guests: 3, date: new Date().toISOString().split('T')[0], time: '20:00', notes: '', status: 'pending', table: 'C3' }
  ])

  const customers = ref<any[]>([])

  const salesData = ref({
    weekly: [
      { day: 'Lun', sales: 0 },
      { day: 'Mar', sales: 0 },
      { day: 'Mié', sales: 0 },
      { day: 'Jue', sales: 0 },
      { day: 'Vie', sales: 0 },
      { day: 'Sáb', sales: 0 },
      { day: 'Dom', sales: 0 }
    ],
    categories: [
      { name: 'Platos', value: 0 },
      { name: 'Bebidas', value: 0 },
      { name: 'Postres', value: 0 },
      { name: 'Snacks', value: 0 }
    ]
  })

  const loadMenuItems = async () => {
    try {
      const data = await fetchJson(`${API_BASE}/menu`)
      menuItems.value = data.map((item: any) => ({
        id: item.id,
        name: item.nombre,
        category: item.categoria,
        price: Number(item.precio),
        description: item.descripcion,
        available: Boolean(item.disponible),
        tiempo_cocina_min: item.tiempo_cocina_min,
        nota_alergenos: item.nota_alergenos,
        imagen: item.imagen,
        createdAt: item.creado_en
      }))
    } catch (error) {
      console.error("Error cargando menu:", error)
    }
  }

  const uploadMenuImage = async (file: File) => {
    const formData = new FormData()
    formData.append('image', file)
    return fetchJson(`${API_BASE}/menu/upload`, {
      method: 'POST',
      body: formData
    })
  }

  const addMenuItem = async (item: any) => {
    try {
      const payload: any = {
        categoria: item.category,
        nombre: item.name,
        descripcion: item.description,
        precio: Number(item.price),
        disponible: item.available,
        tiempo_cocina_min: Number(item.tiempo_cocina_min || 15),
        nota_alergenos: item.nota_alergenos || null,
        imagen: item.imagen || null
      }

      if (item.imageFile) {
        const upload = await uploadMenuImage(item.imageFile)
        payload.imagen = upload.path
      }

      await fetchJson(`${API_BASE}/menu`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })
      await loadMenuItems()
    } catch (error) {
      console.error("Error creando menu:", error)
    }
  }

  const updateMenuItem = async (id: number, update: any) => {
    try {
      const payload: any = {
        categoria: update.category,
        nombre: update.name,
        descripcion: update.description,
        precio: Number(update.price),
        disponible: update.available,
        tiempo_cocina_min: Number(update.tiempo_cocina_min || 15),
        nota_alergenos: update.nota_alergenos || null,
        imagen: update.imagen || null
      }

      if (update.imageFile) {
        const upload = await uploadMenuImage(update.imageFile)
        payload.imagen = upload.imageUrl
      }

      await fetchJson(`${API_BASE}/menu/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })
      await loadMenuItems()
    } catch (error) {
      console.error("Error actualizando menu:", error)
    }
  }

  const deleteMenuItem = async (id: number) => {
    try {
      await fetchJson(`${API_BASE}/menu/${id}`, { method: 'DELETE' })
      menuItems.value = menuItems.value.filter((item) => item.id !== id)
    } catch (error) {
      console.error("Error eliminando menu:", error)
    }
  }

  const loadOrders = async () => {
    try {
      const data = await fetchJson(`${API_BASE}/orders`)
      orders.value = data
    } catch (error) {
      console.error("Error cargando pedidos:", error)
    }
  }

  const updateOrderStatus = async (id: number, status: string) => {
    try {
      await fetchJson(`${API_BASE}/orders/${id}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status })
      })
      await loadOrders()
    } catch (error) {
      console.error("Error actualizando estado de pedido:", error)
    }
  }

  const createOrder = async (order: any) => {
    try {
      await fetchJson(`${API_BASE}/orders`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(order)
      })
      await loadOrders()
    } catch (error) {
      console.error("Error creando pedido:", error)
    }
  }

  const loadTables = async () => {
    try {
      const data = await fetchJson(`${API_BASE}/tables`)
      tables.value = data.map((row: any) => ({
        id: row.id,
        number: row.nombre || `Mesa ${row.id}`,
        capacity: row.capacidad,
        status: row.activa
          ? row.occupied
            ? 'occupied'
            : row.reservation_id
              ? 'reserved'
              : 'available'
          : 'unavailable',
        reservation: row.reservation_id
          ? {
              id: row.reservation_id,
              name: row.cliente_nombre,
              phone: row.cliente_telefono,
              guests: row.personas,
              date: row.fecha,
              time: row.hora,
              notes: row.notas,
              status: row.reservation_estado,
              table: row.nombre || `Mesa ${row.id}`
            }
          : null
      }))
    } catch (error) {
      console.error("Error cargando mesas:", error)
    }
  }

  const createTable = async (table: any) => {
    try {
      await fetchJson(`${API_BASE}/tables`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(table)
      })
      await loadTables()
    } catch (error) {
      console.error('Error creando mesa:', error)
    }
  }

  const updateTableStatus = async (id: number, status: string) => {
    const table = tables.value.find((t) => t.id === id)
    if (!table) return
    table.status = status
  }

  const loadReservations = async () => {
    try {
      const data = await fetchJson(`${API_BASE}/reservations`)
      reservations.value = data.map((item: any) => ({
        id: item.id,
        mesa_id: item.mesa_id,
        name: item.nombre,
        phone: item.telefono,
        email: item.correo,
        table: item.mesa_nombre || `Mesa ${item.mesa_id}`,
        guests: item.personas,
        date: item.fecha,
        time: item.hora,
        notes: item.notas,
        status: item.estado
      }))
    } catch (error) {
      console.error("Error cargando reservaciones:", error)
    }
  }

  const createReservation = async (reservation: any) => {
    try {
      await fetchJson(`${API_BASE}/reservations`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(reservation)
      })
      await loadReservations()
      await loadTables()
    } catch (error) {
      console.error("Error creando reservacion:", error)
    }
  }

  const updateReservation = async (id: number, update: any) => {
    try {
      await fetchJson(`${API_BASE}/reservations/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(update)
      })
      await loadReservations()
      await loadTables()
    } catch (error) {
      console.error("Error actualizando reservacion:", error)
    }
  }

  const loadCustomers = async () => {
    try {
      const data = await fetchJson(`${API_BASE}/customers`)
      customers.value = data.map((item: any) => ({
        id: item.id,
        name: item.nombre,
        phone: item.telefono,
        email: item.correo,
        notes: item.notas
      }))
    } catch (error) {
      console.error("Error cargando clientes:", error)
    }
  }

  const createCustomer = async (customer: any) => {
    try {
      const response = await fetchJson(`${API_BASE}/customers`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nombre: customer.name,
          telefono: customer.phone,
          correo: customer.email || null,
          notas: customer.notes || null
        })
      })
      await loadCustomers()
      return response
    } catch (error) {
      console.error("Error creando cliente:", error)
      throw error
    }
  }

  const createPayment = async (payment: any) => {
    try {
      const response = await fetchJson(`${API_BASE}/payments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payment)
      })
      return response
    } catch (error) {
      console.error("Error procesando pago:", error)
      throw error
    }
  }

  const getPayments = async (pedido_id: number) => {
    try {
      const data = await fetchJson(`${API_BASE}/payments?pedido_id=${pedido_id}`)
      return data
    } catch (error) {
      console.error("Error obteniendo pagos:", error)
      return []
    }
  }

  return {
    menuItems,
    orders,
    tables,
    reservations,
    customers,
    salesData,
    loadMenuItems,
    loadOrders,
    loadTables,
    loadReservations,
    loadCustomers,
    addMenuItem,
    updateMenuItem,
    deleteMenuItem,
    uploadMenuImage,
    createReservation,
    updateReservation,
    updateTableStatus,
    createTable,
    updateOrderStatus,
    createOrder,
    createCustomer,
    createPayment,
    getPayments
  }
})
