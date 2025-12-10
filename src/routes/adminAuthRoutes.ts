import { Router } from "express";
import { adminRegister, adminLogin } from "../controllers/adminAuthController.js";

const router = Router();

router.post("/signup", adminRegister);
router.post("/login", adminLogin);

export default router;
