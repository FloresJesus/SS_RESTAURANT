const express = require("express")
const cors = require("cors")
const path = require("path")
require("dotenv").config()

const authRoutes = require("./routes/authRoutes")
const userRoutes = require("./routes/userRoutes")
const customerRoutes = require("./routes/customerRoutes")
const menuRoutes = require("./routes/menuRoutes")
const tableRoutes = require("./routes/tableRoutes")
const reservationRoutes = require("./routes/reservationRoutes")
const publicReservationRoutes = require("./routes/publicReservationRoutes")
const orderRoutes = require("./routes/orderRoutes")
const paymentRoutes = require("./routes/paymentRoutes")

const { verifyToken } = require("./middleware/authMiddleware")
const { checkRole } = require("./middleware/roleMiddleware")

const app = express()

app.use(cors())
app.use(express.json())
app.use(express.urlencoded({ extended: true }))

app.use("/uploads", express.static(path.join(__dirname, "uploads")))
app.use("/api/auth", authRoutes)
app.use("/api/public/reservations", publicReservationRoutes)
app.use("/api/users", verifyToken, checkRole(["admin"]), userRoutes)
app.use("/api/customers", verifyToken, customerRoutes)
app.use("/api/menu", verifyToken, menuRoutes)
app.use("/api/tables", verifyToken, tableRoutes)
app.use("/api/reservations", verifyToken, reservationRoutes)
app.use("/api/orders", verifyToken, orderRoutes)
app.use("/api/payments", verifyToken, paymentRoutes)

const PORT = process.env.PORT || 3000

app.listen(PORT, () => {
  console.log("Servidor corriendo en puerto " + PORT)
})