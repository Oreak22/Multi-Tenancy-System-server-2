const express = require("express");
const {
	login,
	resetPassword,
	resetPasswordConfirm,
} = require("../controllers/authController");

const router = express.Router();

router.post("/login", login);
router.post("/resetpassword", resetPassword);
router.post("/changepassword", resetPasswordConfirm);

module.exports = router;
