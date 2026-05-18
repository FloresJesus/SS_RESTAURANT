import { defineStore } from 'pinia'
import { ref } from 'vue'
import { apiFetch, API_BASE } from '@/utils/api'

export interface MenuItem {
  id: number
  categoria_id: number | null
  categoria_nombre: string
  nombre: string
  descripcion: string
  precio: number
  imagen_url: string | null
  disponible: boolean
  creado_en: string
}

export interface OrderItem {
  id: number
  producto_id: number
  nombre: string
  cantidad: number
  precio_unitario: number
  subtotal: number
  estado: string
  observaciones: string | null
}

export interface Order {
  id: number
  mesa_id: number
  mesa_numero: number
  cliente_id: number | null
  cliente_nombre: string | null
  reserva_id: number | null
  mesero_id: number
  mesero_nombre: string | null
  estado_servicio: string
  estado_pago: string
  metodo_pago: string | null
  observaciones: string | null
  subtotal: number
  total: number
  time: string
  creado_en: string
  status: string
  items: OrderItem[]
}

export interface Table {
  id: number
  numero: number
  capacidad: number
  estado: 'libre' | 'ocupada' | 'mantenimiento'
  tiene_pedido_activo: boolean
}

export interface Reservation {
  id: number
  cliente_id: number | null
  mesa_id: number
  cantidad_personas: number
  fecha_reserva: string
  hora_reserva: string
  estado: 'pendiente' | 'confirmada' | 'cancelada' | 'completada' | 'no_asistio'
  observaciones: string | null
  creado_en: string
  cliente_nombre: string | null
  cliente_telefono: string | null
  cliente_email: string | null
  mesa_numero: number | null
}

export interface Customer {
  id: number
  nombre: string
  telefono: string
  email: string | null
  creado_en: string
}

export interface SalesStats {
  weekly: { day: string; sales: number }[]
  topProducts: { name: string; quantity: number; value: number }[]
  today: { orders: number; sales: number }
  categories: { categoria: string; total_ventas: number }[]
}

export const useRestaurantStore = defineStore('restaurant', () => {
  const menuItems = ref<MenuItem[]>([])
  const categories = ref<{ id: number; nombre: string }[]>([])
  const orders = ref<Order[]>([])
  const tables = ref<Table[]>([])
  const reservations = ref<Reservation[]>([])
  const customers = ref<Customer[]>([])

  const salesData = ref<SalesStats>({
    weekly: [
      { day: 'Lun', sales: 0 },
      { day: 'Mar', sales: 0 },
      { day: 'Mié', sales: 0 },
      { day: 'Jue', sales: 0 },
      { day: 'Vie', sales: 0 },
      { day: 'Sáb', sales: 0 },
      { day: 'Dom', sales: 0 }
    ],
    topProducts: [],
    today: { orders: 0, sales: 0 },
    categories: []
  })

  const loadSalesStats = async () => {
    try {
      const data = await apiFetch(`${API_BASE}/orders/stats`)
      salesData.value = data
    } catch (error) {
      console.error("Error cargando estadisticas de ventas:", error)
    }
  }

  const loadMenuItems = async () => {
    try {
      const data = await apiFetch(`${API_BASE}/menu`)
      menuItems.value = data.map((item: any) => ({
        id: item.id,
        categoria_id: item.categoria_id,
        categoria_nombre: item.categoria_nombre || 'Sin categoria',
        nombre: item.nombre,
        descripcion: item.descripcion || '',
        precio: Number(item.precio),
        imagen_url: item.imagen_url,
        disponible: Boolean(item.disponible),
        creado_en: item.creado_en
      }))
    } catch (error) {
      console.error("Error cargando menu:", error)
    }
  }

  const loadCategories = async () => {
    try {
      const data = await apiFetch(`${API_BASE}/menu/categorias`)
      categories.value = data
    } catch (error) {
      console.error("Error cargando categorias:", error)
    }
  }

  const uploadMenuImage = async (file: File) => {
    const formData = new FormData()
    formData.append('image', file)
    return apiFetch(`${API_BASE}/menu/upload`, {
      method: 'POST',
      body: formData
    })
  }

  const addMenuItem = async (item: any) => {
    const payload: any = {
      categoria_id: item.categoria_id || null,
      nombre: item.nombre,
      descripcion: item.descripcion || '',
      precio: Number(item.precio),
      disponible: item.disponible !== false
    }

    if (item.imageFile) {
      const upload = await uploadMenuImage(item.imageFile)
      payload.imagen_url = upload.path
    }

    await apiFetch(`${API_BASE}/menu`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    })
    await loadMenuItems()
  }

  const updateMenuItem = async (id: number, update: any) => {
    const payload: any = {
      categoria_id: update.categoria_id || null,
      nombre: update.nombre,
      descripcion: update.descripcion || '',
      precio: Number(update.precio),
      disponible: update.disponible !== false
    }

    if (update.imageFile) {
      const upload = await uploadMenuImage(update.imageFile)
      payload.imagen_url = upload.path
    }

    await apiFetch(`${API_BASE}/menu/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    })
    await loadMenuItems()
  }

  const deleteMenuItem = async (id: number) => {
    await apiFetch(`${API_BASE}/menu/${id}`, { method: 'DELETE' })
    await loadMenuItems()
  }

  const loadOrders = async () => {
    try {
      const data = await apiFetch(`${API_BASE}/orders`)
      orders.value = data
    } catch (error) {
      console.error("Error cargando pedidos:", error)
    }
  }

  const getOrderById = async (id: number) => {
    return apiFetch(`${API_BASE}/orders/${id}`)
  }

  const updateOrderStatus = async (id: number, status: string) => {
    await apiFetch(`${API_BASE}/orders/${id}/status`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status })
    })
    await loadOrders()
  }

  const createOrder = async (order: any) => {
    const response = await apiFetch(`${API_BASE}/orders`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(order)
    })
    await loadOrders()
    await loadTables()
    return response
  }

  const updateOrderItems = async (orderId: number, items: any[]) => {
    await apiFetch(`${API_BASE}/orders/${orderId}/items`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ items })
    })
    await loadOrders()
  }

  const loadTables = async () => {
    try {
      const data = await apiFetch(`${API_BASE}/tables`)
      tables.value = data.map((row: any) => ({
        id: row.id,
        numero: row.numero,
        capacidad: row.capacidad,
        estado: row.estado,
        tiene_pedido_activo: Boolean(row.tiene_pedido_activo)
      }))
    } catch (error) {
      console.error("Error cargando mesas:", error)
    }
  }

  const createTable = async (table: any) => {
    await apiFetch(`${API_BASE}/tables`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        numero: table.numero,
        capacidad: Number(table.capacidad)
      })
    })
    await loadTables()
  }

  const updateTableStatus = async (id: number, estado: 'libre' | 'ocupada' | 'mantenimiento') => {
    await apiFetch(`${API_BASE}/tables/${id}/estado`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ estado })
    })
    await loadTables()
  }

  const getAvailableTables = async () => {
    return apiFetch(`${API_BASE}/tables/disponibles`)
  }

  const loadReservations = async () => {
    try {
      const data = await apiFetch(`${API_BASE}/reservations`)
      reservations.value = data.map((item: any) => ({
        id: item.id,
        cliente_id: item.cliente_id,
        mesa_id: item.mesa_id,
        cantidad_personas: item.cantidad_personas,
        fecha_reserva: item.fecha_reserva,
        hora_reserva: item.hora_reserva,
        estado: item.estado,
        observaciones: item.observaciones,
        creado_en: item.creado_en,
        cliente_nombre: item.cliente_nombre,
        cliente_telefono: item.cliente_telefono,
        cliente_email: item.cliente_email,
        mesa_numero: item.mesa_numero
      }))
    } catch (error) {
      console.error("Error cargando reservaciones:", error)
    }
  }

  const createReservation = async (reservation: any) => {
    const response = await apiFetch(`${API_BASE}/reservations`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(reservation)
    })
    await loadReservations()
    await loadTables()
    return response
  }

  const updateReservation = async (id: number, update: any) => {
    await apiFetch(`${API_BASE}/reservations/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(update)
    })
    await loadReservations()
    await loadTables()
  }

  const updateReservationStatus = async (id: number, estado: string) => {
    await apiFetch(`${API_BASE}/reservations/${id}/estado`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ estado })
    })
    await loadReservations()
  }

  const getAvailableTablesForReservation = async (fecha: string, cantidad: number) => {
    return apiFetch(`${API_BASE}/reservations/mesas-disponibles?fecha_reserva=${fecha}&cantidad_personas=${cantidad}`)
  }

  const loadCustomers = async () => {
    try {
      const data = await apiFetch(`${API_BASE}/customers`)
      customers.value = data.map((item: any) => ({
        id: item.id,
        nombre: item.nombre,
        telefono: item.telefono,
        email: item.email,
        creado_en: item.creado_en
      }))
    } catch (error) {
      console.error("Error cargando clientes:", error)
    }
  }

  const createCustomer = async (customer: any) => {
    const response = await apiFetch(`${API_BASE}/customers`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        nombre: customer.nombre,
        telefono: customer.telefono,
        email: customer.email || null
      })
    })
    await loadCustomers()
    return response
  }

  const updateCustomer = async (id: number, customer: any) => {
    await apiFetch(`${API_BASE}/customers/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        nombre: customer.nombre,
        telefono: customer.telefono,
        email: customer.email || null
      })
    })
    await loadCustomers()
  }

  const deleteCustomer = async (id: number) => {
    await apiFetch(`${API_BASE}/customers/${id}`, { method: 'DELETE' })
    await loadCustomers()
  }

  const createPayment = async (payment: any) => {
    return apiFetch(`${API_BASE}/payments`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payment)
    })
  }

  const getPayments = async (pedido_id: number) => {
    return apiFetch(`${API_BASE}/payments?pedido_id=${pedido_id}`)
  }

  const generateTicket = async (pedido_id: number) => {
    return apiFetch(`${API_BASE}/tickets`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ pedido_id })
    })
  }

  const generateInvoice = async (invoice: any) => {
    return apiFetch(`${API_BASE}/invoices`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(invoice)
    })
  }

  return {
    menuItems,
    categories,
    orders,
    tables,
    reservations,
    customers,
    salesData,
    loadMenuItems,
    loadCategories,
    loadOrders,
    loadTables,
    loadReservations,
    loadCustomers,
    loadSalesStats,
    addMenuItem,
    updateMenuItem,
    deleteMenuItem,
    uploadMenuImage,
    createReservation,
    updateReservation,
    updateReservationStatus,
    updateTableStatus,
    createTable,
    updateOrderStatus,
    createOrder,
    updateOrderItems,
    getOrderById,
    createCustomer,
    updateCustomer,
    deleteCustomer,
    createPayment,
    getPayments,
    generateTicket,
    generateInvoice,
    getAvailableTables,
    getAvailableTablesForReservation
  }
})
