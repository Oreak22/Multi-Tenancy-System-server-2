const bcrypt = require("bcryptjs");
const { getTenantDB } = require("../config/db");
const userSchema = require("../models/User");

const fetchDetails = async (req, res) => {
	try {
		// Ensure req.user exists and contains tenantId
		if (!req.user || !req.user.tenantId || !req.user.email) {
			return res
				.status(400)
				.json({ error: "Invalid request: Missing user details" });
		}

		const { tenantId, email } = req.user;
		const tenantDB = await getTenantDB(tenantId);

		if (!tenantDB) {
			return res.status(404).json({ error: "Tenant database not found" });
		}

		// Get the User model specific to the tenant's database
		const UserModel = tenantDB.model("User", userSchema);
		const user = await UserModel.findOne({ email }).select("-password"); // Exclude password field

		if (!user) {
			return res.status(404).json({ error: "User not found" });
		}

		res.status(200).json(user);
	} catch (error) {
		console.error("Error fetching user details:", error);
		res.status(500).json({ error: "Internal server error" });
	}
};

const fetchAllUsers = async (req, res) => {
	try {
		// Ensure req.user exists and contains tenantId
		if (!req.user || !req.user.tenantId) {
			return res
				.status(400)
				.json({ error: "Invalid request: Missing tenant details" });
		}

		const { tenantId } = req.user;
		const tenantDB = await getTenantDB(tenantId);

		if (!tenantDB) {
			return res.status(404).json({ error: "Tenant database not found" });
		}


		// Get the User model specific to the tenant's database
		const UserModel = tenantDB.model("User", userSchema);
		const users = await UserModel.find().select("-password"); // Exclude password field

		if (!users || users.length === 0) {
			return res.status(404).json({ error: "No users found for this tenant" });
		}

		// Map users to return only relevant fields
		const allUsers = users.map((user) => ({
			id: user._id,
			name: user.name,
			email: user.email,
			role: user.role,
			createdAt: user.createdAt,
			updatedAt: user.updatedAt,
		}));

		res.status(200).json(allUsers);
	} catch (error) {
		console.error("Error fetching users:", error);
		res.status(500).json({ error: "Internal server error" });
	}
};

const createUser = async (req, res) => {
	try {
		const { tenantId } = req.user;
		const { name, email, password, role } = req.body;

		if (!name || !email || !password) {
			return res.status(400).json({ error: "All fields are required" });
		}


		const tenantDB = await getTenantDB(tenantId);
		const User = tenantDB.model("User", userSchema);

		const hashedPassword = await bcrypt.hash(password, 10);
		const newUser = await User.create({
			name,
			email,
			password: hashedPassword,
			role,
		});

		res
			.status(201)
			.json({ message: "User created successfully", userId: newUser._id });
	} catch (error) {
		res.status(500).json({ error: error.message });
	}
};

const updateUser = async (req, res) => {
	try {
		const { tenantId, userId } = req.user;
		const { name, email, password } = req.body;

		const tenantDB = await getTenantDB(tenantId);
		const User = tenantDB.model("User", userSchema);

		// Fetch user by ID
		let user = await User.findOne({ _id: userId });
		if (!user) return res.status(404).json({ error: "User not found" });

		// Check if the logged-in user is authorized to update this user
		if (req.user.email !== user.email) {
			return res
				.status(403)
				.json({ error: "Not authorized to edit this user" });
		}

		// Update user details
		const updatedFields = {};
		if (name) updatedFields.name = name;
		if (email) updatedFields.email = email;
		if (password && password.trim() !== "") {
			updatedFields.password = await bcrypt.hash(password, 10);
		}

		// Update user in DB
		user = await User.findByIdAndUpdate(userId, updatedFields, {
			new: true,
		}).select("-password");

		res.json({ message: "User updated successfully", user });
	} catch (error) {
		console.error("Error updating user:", error);
		res.status(500).json({ error: "Internal server error" });
	}
};

const deleteUser = async (req, res) => {
	try {
    const { tenantId } = req.user;
		const { userId } = req.params;
    
		const tenantDB = await getTenantDB(tenantId);
		const User = tenantDB.model("User", userSchema);
    
		// Check if the user exists
		const userToDelete = await User.findById(userId);
		if (!userToDelete) {
			return res.status(404).json({ error: "User not found" });
		}

		// Ensure only an admin can delete users
		if (req.user.role !== "ADMIN") {
			return res.status(403).json({ error: "Not authorized to delete users" });
		}

		// Delete the user
		await User.findByIdAndDelete(userId);

		res.json({ message: "User deleted successfully" });
	} catch (error) {
		// console.error("Error deleting user:", error);
		res.status(500).json({ error: "Internal server error" });
	}
};

module.exports = {
	fetchDetails,
	fetchAllUsers,
	createUser,
	updateUser,
	deleteUser,
};
