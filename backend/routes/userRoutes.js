import express from "express"
import {protectRoute, isAdminRoute} from "../middleware/authMiddleware.js"
import { getAllUsers, getUserById, addUser, deleteUser, registerUser, loginUser, logoutUser } from "../controllers/userController.js"


const router = express.Router();


router.get('/',protectRoute, isAdminRoute, getAllUsers);
router.get('/:id',protectRoute, isAdminRoute, getUserById);


router.post('/', addUser);
// router.post("/register", registerUser);
// router.post("/login", loginUser);
router.post("/logout", logoutUser);


router.delete('/:id', deleteUser);

export default router
