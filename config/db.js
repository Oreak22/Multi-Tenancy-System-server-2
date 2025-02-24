const mongoose = require("mongoose");
require("dotenv").config();
const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

// Connect to Prisma (Global Tenant Database)
const connectGlobalDB = async () => {
  try {
    await prisma.$connect();
    console.log("Connected to Prisma (Global DB)");
  } catch (error) {
    console.error("Prisma connection error:", error);
  }
};

// Multi-Tenant MongoDB Connection
const tenantConnections = {};

const getTenantDB = async (tenantId) => {
  if (!tenantConnections[tenantId]) {
    const dbUri = `${process.env.MONGO_URI}/${tenantId}`;  // Connect dynamically to tenant DB
    tenantConnections[tenantId] = mongoose.createConnection(dbUri, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    console.log(`Connected to tenant DB: ${tenantId}`);
  }
  return tenantConnections[tenantId];
};

module.exports = { prisma, connectGlobalDB, getTenantDB };
