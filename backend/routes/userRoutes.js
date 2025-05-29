import express from "express"

import { getAllUsers, getUserById, addUser, deleteUser, registerUser, loginUser, logoutUser } from "../controllers/userController.js"


const router = express.Router();


router.get('/', getAllUsers);
router.get('/:id', getUserById);


router.post('/', addUser);
router.post("/register", registerUser);
router.post("/login", loginUser);
router.post("/logout", logoutUser);


router.delete('/:id', deleteUser);

export default router
