const jwt = require("jsonwebtoken");
require("dotenv").config();

const authMiddleware = (req, res, next) => {
	const token = req.header("Authorization");
	console.log(token);
	if (!token) return res.status(401).json({ error: "Access denied" });

	try {
		const decoded = jwt.verify(
			token.replace("Bearer ", ""),
			process.env.JWT_SECRET,
		);
		req.user = decoded;
		next();
	} catch (error) {
		res.status(403).json({ error: "Invalid or expired token" });
	}
};

module.exports = authMiddleware;
