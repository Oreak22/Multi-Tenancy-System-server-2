const express = require("express");
const {
	createUser,
	fetchDetails,
	fetchAllUsers,
} = require("../controllers/userController");
const { updateUser } = require("../controllers/userController");
const authMiddleware = require("../middlewares/authMiddleware");

const router = express.Router();

router.post("/create", authMiddleware, createUser);
router.post("/update", authMiddleware, updateUser);

router.get("/fetch", authMiddleware, fetchDetails);
router.get("/fetchall", authMiddleware, fetchAllUsers);

module.exports = router;
