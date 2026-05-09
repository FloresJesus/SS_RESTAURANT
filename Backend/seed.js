require('dotenv').config()
const mysql = require('mysql2/promise')

async function seed() {
  const conn = await mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME
  })

  console.log('Inserting seed data...')

  await conn.query('DELETE FROM detalle_pedido')
  await conn.query('DELETE FROM pedido')
  await conn.query('DELETE FROM reserva')
  await conn.query('DELETE FROM cliente')
  await conn.query('DELETE FROM producto')
  await conn.query('DELETE FROM categoria_producto')
  await conn.query('DELETE FROM mesa')

  await conn.query(`INSERT INTO categoria_producto (nombre) VALUES 
    ('Entradas'), ('Platos Principales'), ('Bebidas'), ('Postres')`)

  await conn.query(`INSERT INTO producto (categoria_id, nombre, descripcion, precio) VALUES 
    (1, 'Ceviche', 'Pescado fresco en leche de tigre', 45.00),
    (1, 'Empanadas', 'Tres empanadas tradicionales', 18.00),
    (2, 'Lomo Saltado', 'Carne con cebolla y papas', 55.00),
    (2, 'Pollo a la Brasa', 'Medio pollo con ensalada', 65.00),
    (3, 'Chicha Morada', 'Bebida tradicional', 8.00),
    (3, 'Limonada', 'Limonada con hierbabuena', 6.00),
    (4, 'Suspiro Limeño', 'Dulce de leche', 15.00)`)

  await conn.query(`INSERT INTO mesa (numero, capacidad, estado) VALUES 
    (1, 4, 'libre'), (2, 4, 'libre'), (3, 6, 'libre'), (4, 2, 'libre'), (5, 8, 'libre')`)

  await conn.query(`INSERT INTO cliente (nombre, telefono, email) VALUES 
    ('Juan Perez', '70012345', 'juan@email.com'),
    ('Maria Lopez', '70023456', 'maria@email.com')`)

  console.log('Seed complete!')
  await conn.end()
}

seed().catch(console.error)