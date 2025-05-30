import express from "express"
import { login, signup, verify} from "../controllers/authController.js";

// const express = require('express');
// const { signup, verifyCode, login } = require('../controllers/authController');
const router = express.Router();

router.post('/signup', signup);
router.post('/verify', verify);
router.post('/login', login);

export default router
