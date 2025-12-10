import { Request, Response } from "express";
import jwt from "jsonwebtoken";
import bcryptjs from "bcryptjs";
import Admin from "../models/Admin.js";

const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key-change-in-production";
const JWT_EXPIRE = "7d";

export const adminRegister = async (req: Request, res: Response): Promise<void> => {
  try {
    const { name, email, password } = req.body;

    const existingAdmin = await Admin.findOne({ email });
    if (existingAdmin) {
      res.status(409).json({ message: "Email already registered" });
      return;
    }

    const hashedPassword = await bcryptjs.hash(password, 10);

    const newAdmin = new Admin({
      name,
      email,
      password: hashedPassword,
      role: "admin",
    });

    await newAdmin.save();

    const token = jwt.sign({ adminId: newAdmin._id, role: newAdmin.role }, JWT_SECRET, { expiresIn: JWT_EXPIRE });

    res.status(201).json({
      message: "Admin registered successfully",
      token,
      admin: { id: newAdmin._id, email: newAdmin.email, name: newAdmin.name, role: newAdmin.role },
    });
  } catch (error) {
    console.error("Admin register error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

export const adminLogin = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password } = req.body;

    const admin = await Admin.findOne({ email }).select("+password");
    if (!admin) {
      res.status(401).json({ message: "Invalid email or password" });
      return;
    }

    const isPasswordValid = await bcryptjs.compare(password, admin.password);
    if (!isPasswordValid) {
      res.status(401).json({ message: "Invalid email or password" });
      return;
    }

    const token = jwt.sign({ adminId: admin._id, role: admin.role }, JWT_SECRET, { expiresIn: JWT_EXPIRE });

    res.status(200).json({
      message: "Login successful",
      token,
      admin: { id: admin._id, email: admin.email, name: admin.name, role: admin.role },
    });
  } catch (error) {
    console.error("Admin login error:", error);
    res.status(500).json({ message: "Server error" });
  }
};
