const mongoose = require("mongoose");

const tenantSchema = new mongoose.Schema({
  name: { type: String, unique: true, required: true },
  tenantId: { type: String, unique: true, required: true },
  dbUri: { type: String, required: true },
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model("Tenant", tenantSchema);
