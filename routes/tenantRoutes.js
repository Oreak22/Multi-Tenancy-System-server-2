const express = require("express");
const { createTenant } = require("../controllers/tenantController");

const router = express.Router();

router.post("/create", createTenant);

module.exports = router;
