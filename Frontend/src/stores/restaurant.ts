import { defineStore } from 'pinia'
import { ref } from 'vue'

export const useRestaurantStore = defineStore('restaurant', () => {
  const menuItems = ref([
    { id: 1, name: 'Lomo Saltado', category: 'Platos Principales', price: 0, description: 'Carne salteada con cebolla, tomate y papas fritas.', available: true },
    { id: 2, name: 'Ceviche Mixto', category: 'Entradas', price: 0, description: 'Pescado y mariscos en salsa de limón y ají.', available: true },
    { id: 3, name: 'Tiradito', category: 'Entradas', price: 0, description: 'Filete de pescado en salsa de ají amarillo y leche de tigre.', available: true },
    { id: 4, name: 'Suspiro Limeño', category: 'Postres', price: 0, description: 'Dulce de leche con merengue y canela.', available: true },
    { id: 5, name: 'Limonada', category: 'Bebidas', price: 0, description: 'Refrescante limonada con hierbabuena.', available: true }
  ])

  const orders = ref([
    { id: 101, table: 5, waiter: 'Luis', time: '12:45', status: 'pending', total: 520, items: [ { name: 'Lomo Saltado', qty: 1, price: 180 }, { name: 'Limonada', qty: 2, price: 45 } ] },
    { id: 102, table: 2, waiter: 'María', time: '13:10', status: 'preparing', total: 310, items: [ { name: 'Ceviche Mixto', qty: 1, price: 120 }, { name: 'Tiradito', qty: 1, price: 110 }, { name: 'Limonada', qty: 1, price: 45 } ] }
  ])

  const tables = ref([
    { id: 1, number: 1, capacity: 4, status: 'available', reservation: null },
    { id: 2, number: 2, capacity: 6, status: 'occupied', reservation: null },
    { id: 3, number: 3, capacity: 4, status: 'reserved', reservation: { name: 'Lucía', time: '19:30', guests: 4 } },
    { id: 4, number: 4, capacity: 2, status: 'available', reservation: null }
  ])

  const reservations = ref([
    { id: 1, name: 'Lucía', phone: '555-123-4567', guests: 4, date: new Date().toISOString().split('T')[0], time: '19:30', notes: '', status: 'pending' }
  ])

  const employees = ref([
    { id: 1, name: 'Carlos Mendoza', email: 'admin@restaurant.com', phone: '555-010-1010', role: 'admin', shift: 'Manana', status: 'active', avatar: 'CM' },
    { id: 2, name: 'María García', email: 'cocina@restaurant.com', phone: '555-020-2020', role: 'kitchen', shift: 'Tarde', status: 'active', avatar: 'MG' },
    { id: 3, name: 'Juan Pérez', email: 'mesero@restaurant.com', phone: '555-030-3030', role: 'waiter', shift: 'Noche', status: 'active', avatar: 'JP' }
  ])

  const salesData = ref({
    weekly: [
      { day: 'Lun', sales: 4500 },
      { day: 'Mar', sales: 5200 },
      { day: 'Mié', sales: 4600 },
      { day: 'Jue', sales: 5800 },
      { day: 'Vie', sales: 6300 },
      { day: 'Sáb', sales: 7000 },
      { day: 'Dom', sales: 5400 }
    ],
    categories: [
      { name: 'Platos', value: 55 },
      { name: 'Bebidas', value: 20 },
      { name: 'Postres', value: 15 },
      { name: 'Snacks', value: 10 }
    ]
  })

  const addMenuItem = (item: any) => {
    menuItems.value.push({ id: Date.now(), ...item })
  }

  const updateMenuItem = (id: number, update: any) => {
    menuItems.value = menuItems.value.map(item => item.id === id ? { ...item, ...update } : item)
  }

  const deleteMenuItem = (id: number) => {
    menuItems.value = menuItems.value.filter(item => item.id !== id)
  }

  const updateOrderStatus = (id: number, status: string) => {
    orders.value = orders.value.map(order => order.id === id ? { ...order, status } : order)
  }

  const updateTableStatus = (id: number, status: string) => {
    tables.value = tables.value.map(table => table.id === id ? { ...table, status } : table)
  }

  const addReservation = (reservation: any) => {
    reservations.value.push({ id: Date.now(), status: 'pending', ...reservation })
  }

  const updateReservation = (id: number, update: any) => {
    reservations.value = reservations.value.map(reservation => reservation.id === id ? { ...reservation, ...update } : reservation)
  }

  const addEmployee = (employee: any) => {
    employees.value.push({ id: Date.now(), avatar: employee.name.split(' ').map((n: string) => n[0]).join('').toUpperCase(), ...employee })
  }

  const updateEmployee = (id: number, update: any) => {
    employees.value = employees.value.map(employee => employee.id === id ? { ...employee, ...update } : employee)
  }

  return {
    menuItems,
    orders,
    tables,
    reservations,
    employees,
    salesData,
    addMenuItem,
    updateMenuItem,
    deleteMenuItem,
    updateOrderStatus,
    updateTableStatus,
    addReservation,
    updateReservation,
    addEmployee,
    updateEmployee
  }
})
