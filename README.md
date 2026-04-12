# RestauranteSS

Proyecto fullstack dividido en dos carpetas principales:

- `Backend/` - API REST con Express y MySQL
- `Frontend/` - SPA con Vue 3, Vue Router, Pinia y Chart.js

---

## Backend

### Estructura principal

- `Backend/server.js` - servidor Express principal
- `Backend/config/db.js` - configuración de conexión a MySQL
- `Backend/routes/authRoutes.js` - rutas de autenticación
- `Backend/controllers/authController.js` - lógica de login
- `Backend/models/userModels.js` - consultas de usuario a la base de datos
- `Backend/.env` - variables de entorno para DB y otras credenciales

### Comandos

```bash
cd Backend
npm install
node server.js
```

> Si usas desarrollo con recarga automática:

```bash
npm install -g nodemon
nodemon server.js
```

### Dependencias principales

- `express`
- `cors`
- `dotenv`
- `mysql2`
- `bcryptjs`
- `jsonwebtoken`

### Función principal

El backend expone un endpoint de autenticación en `/api/auth/login` que usa:

- `userModels.findUserByEmail(email)`
- `bcrypt.compare` para validar contraseña
- `jsonwebtoken` para generar tokens

---

## Frontend

### Estructura principal

- `Frontend/index.html` - plantilla base HTML
- `Frontend/src/main.ts` - punto de entrada de Vue
- `Frontend/src/App.vue` - app shell principal
- `Frontend/src/router/index.ts` - rutas de la aplicación
- `Frontend/src/stores/auth.ts` - estado y acciones de autenticación
- `Frontend/src/stores/restaurant.ts` - estado de datos del restaurante
- `Frontend/src/layouts/AdminLayout.vue` - layout de app con sidebar y topbar
- `Frontend/src/views/` - vistas principales:
  - `DashboardView.vue`
  - `LoginView.vue`
  - `MenuView.vue`
  - `OrdersView.vue`
  - `TablesView.vue`
  - `EmployeesView.vue`
- `Frontend/src/assets/main.css` - estilos base y configuración global
- `Frontend/public/` - activos públicos

### Comandos

```bash
cd Frontend
npm install
npm run dev
```

### Dependencias principales

- `vue`
- `vue-router`
- `pinia`
- `chart.js`
- `vue-chartjs`
- `tailwindcss`

### Comportamiento clave

- `LoginView` inicia sesión y guarda el token en `localStorage`
- `router.beforeEach` protege rutas y redirige a `/login` si no hay token
- `AdminLayout` muestra el sidebar y las opciones de navegación tras login
- `DashboardView` renderiza métricas y gráficos con datos de `restaurant` store

---

## Configuración recomendada

### Backend

Asegúrate de tener un `.env` en `Backend/` con las variables básicas:

```env
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=tu_contraseña
DB_NAME=restaurante
```

### Frontend

- Verifica que `Frontend/index.html` carga la fuente de Material Symbols para los iconos
- Usa `npm run dev` para levantar la app Vue

---

## Notas finales

Este README documenta la estructura del proyecto y los comandos básicos de instalación y ejecución para ambos lados de la aplicación.
