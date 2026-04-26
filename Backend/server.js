const express = require("express")
const cors = require("cors")
require("dotenv").config()

const authRoutes = require("./routes/authRoutes")
const userRoutes = require("./routes/userRoutes")
const customerRoutes = require("./routes/customerRoutes")
const menuRoutes = require("./routes/menuRoutes")   

const app = express()

app.use(cors())
app.use(express.json())

app.use("/api/auth", authRoutes)
app.use("/api/users", userRoutes)
app.use("/api/customers", customerRoutes)

const PORT = 3000

app.listen(PORT, () => {
  console.log("Servidor corriendo en puerto " + PORT)
})