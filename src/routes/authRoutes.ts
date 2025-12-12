import { Router } from "express";
import { register, login, getMe } from "../controllers/authController";
import { authenticate } from "../middleware/auth";
import validatorMiddleware from "../middleware/validatorMiddleware";
import {
  registerValidator,
  loginValidator,
} from "../lib/validators/authValidators";

const router = Router();

// Routes
router.post("/register", registerValidator, validatorMiddleware, register);
router.post("/login", loginValidator, validatorMiddleware, login);
router.get("/me", authenticate, getMe);

export default router;
