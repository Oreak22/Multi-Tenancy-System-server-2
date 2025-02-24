const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const { getTenantDB } = require("../config/db");
const userSchema = require("../models/User");
require("dotenv").config();


const login = async (req, res) => {
	try {
		const { tenantId, email, password } = req.body;
		if (!tenantId || !email || !password)
			return res.status(400).json({ error: "All fields are required" });
		
		const tenantDB = await getTenantDB(tenantId);
		const User = tenantDB.model("User", userSchema);
		
		console.log("login");
		const user = await User.findOne({ email });
		if (!user) return res.status(404).json({ error: "User not found" });

		const validPassword = await bcrypt.compare(password, user.password);
		if (!validPassword)
			return res.status(401).json({ error: "Invalid credentials" });

		// Generate JWT Token
		const token = jwt.sign(
			{ userId: user._id, email, role: user.role, tenantId },
			process.env.JWT_SECRET, // Use the secret key from .env
			{ expiresIn: "24h" },
		);

		res.json({ message: "Login successful", token });
	} catch (error) {
		res.status(500).json({ error: error.message });
	}
};

module.exports = { login };
