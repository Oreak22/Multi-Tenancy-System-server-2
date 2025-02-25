const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const { getTenantDB } = require("../config/db");
const userSchema = require("../models/User");
require("dotenv").config();
const nodemailer = require("nodemailer");
// const bcrypt = require('bcryptjs')

const login = async (req, res) => {
	try {
		const { tenantId, email, password } = req.body;
		if (!tenantId || !email || !password)
			return res.status(400).json({ error: "All fields are required" });

		const tenantDB = await getTenantDB(tenantId);
		const User = tenantDB.model("User", userSchema);

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

const resetPassword = async (req, res) => {
	try {
		const { tenantId, email } = req.body;
		if (!email || !tenantId)
			return res.status(400).json({ error: "All fields are required" });

		const tenantDB = await getTenantDB(tenantId);
		const User = tenantDB.model("User", userSchema);

		const user = await User.findOne({ email });
		if (!user) return res.status(404).json({ error: "User not found" });

		// Generate JWT Token for reset
		const token = jwt.sign(
			{ userId: user._id, email, role: user.role, tenantId },
			process.env.JWT_SECRET,
			{ expiresIn: "1h" },
		);

		// Create reset link
		const resetLink = `${process.env.FRONTEND_URL}/${token}`;

		// Setup nodemailer transporter
		const transporter = nodemailer.createTransport({
			service: "gmail",
			auth: {
				user: process.env.EMAIL_USER,
				pass: process.env.EMAIL_PASS,
			},
		});

		// Email options
		const mailOptions = {
			from: process.env.EMAIL_USER,
			to: email,
			subject: "Password Reset Request",
			html: `<p>Click the link below to reset your password:</p>
				   <a href="${resetLink}" target="_blank">${resetLink}</a>
				   <p>This link expires in 1 hours.</p>`,
		};

		// Send email

		await transporter.sendMail(mailOptions);

		res.json({ message: "Reset link sent to your email", status:'sent' });
	} catch (error) {
		console.error("Error resetting password:", error);
		res.status(500).json({ error: "Internal server error" });
	}
};




const resetPasswordConfirm = async (req, res) => {
	try {
		const { token, newPassword } = req.body;

		// Validate input
		if (!token || !newPassword) {
			return res.status(400).json({ error: "Token and new password are required" });
		}

		// Verify JWT Token
		let decoded;
		try {
			decoded = jwt.verify(token, process.env.JWT_SECRET);
		} catch (error) {
			return res.status(400).json({ error: "Invalid or expired token" });
		}

		// Extract user details from token
		const { userId, tenantId } = decoded;

		// Connect to the correct tenant database
		const tenantDB = await getTenantDB(tenantId);
		const User = tenantDB.model("User", userSchema);

		// Find user by ID
		const user = await User.findById(userId);
		if (!user) {
			return res.status(404).json({ error: "User not found" });
		}

		// Hash new password
		const hashedPassword = await bcrypt.hash(newPassword, 10);

		// Update user password
		await User.findByIdAndUpdate(userId, { password: hashedPassword });

		res.json({ message: "Password reset successfully" });
	} catch (error) {
		console.error("Password reset error:", error);
		res.status(500).json({ error: "Internal server error" });
	}
};

module.exports = { login, resetPassword,resetPasswordConfirm };
