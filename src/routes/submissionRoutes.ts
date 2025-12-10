import { Router } from "express";
import { getAllSubmissions } from "../controllers/submissionController.js";

const router = Router();

router.get("/", getAllSubmissions);

export default router;
