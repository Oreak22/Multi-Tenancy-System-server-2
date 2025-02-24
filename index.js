const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");
const { connectGlobalDB } = require("./config/db");
require("dotenv").config();

const tenantRoutes = require("./routes/tenantRoutes");
const userRoutes = require("./routes/userRoutes");
const authRoutes = require("./routes/authRoutes");

const app = express();
app.use(cors());
app.use(bodyParser.json());

// Use routes
app.use("/api/tenants", tenantRoutes);
app.use("/api/users", userRoutes);
app.use("/api/auth", authRoutes);

// Connect to Global Database
connectGlobalDB();
const port = process.env.PORT || 5000;

app.listen(port, () => console.log(`Server running on port ${port}`));
