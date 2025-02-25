const { prisma, getTenantDB } = require("../config/db");
const UserSchema = require("../models/User");
const bcrypt = require("bcryptjs");

const createTenant = async (req, res) => {
	try {
		const { name, organizationName, adminEmail, password } = req.body;

		// Validate required fields
		if (!name)
			return res.status(400).json({ error: "Tenant name is required" });
		if (!organizationName)
			return res.status(400).json({ error: "Organization name is required" });
		if (!adminEmail)
			return res.status(400).json({ error: "Admin email is required" });
		if (!password)
			return res.status(400).json({ error: "Password is required" });

		// Check if organization already exists
		const organizationExists = await prisma.tenant.findUnique({
			where: { tenantId: organizationName }, // Ensure `tenantId` is unique
		});

		if (organizationExists) {
			return res.status(400).json({ error: "Organization already exists" });
		}

		// Create new tenant
		const tenant = await prisma.tenant.create({
			data: { name, tenantId: organizationName },
		});

		//  creating admin
		try {
			const tenantDB = await getTenantDB(tenant.tenantId);
			const User = tenantDB.model("User", UserSchema);

			const hashedPassword = await bcrypt.hash(password, 10);
			const newUser = await User.create({
				name,
				email: adminEmail,
				password: hashedPassword,
				role: "ADMIN",
			});

			res
				.status(201)
				.json({ message: "Room created successfully", tenantId: tenant.tenantId });
		} catch (error) {
			// deleting tenant if user creation fails
			const deletedUser = await prisma.tenant.delete({
				where: {
					tenantId: tenant.tenantId,
				},
			});
			console.error("Error deleting user:", error);
			res.status(500).json({ error: error.message });
		}

		//


		
	} catch (error) {
		console.error("Error creating tenant:", error);
		return res.status(500).json({ error: "Internal Server Error" });
	}
};

module.exports = { createTenant };
