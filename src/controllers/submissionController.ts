import { Request, Response } from "express";
import Submission from "../models/Submission.js";

export const getAllSubmissions = async (_req: Request, res: Response): Promise<void> => {
  try {
    const submissions = await Submission.find()
      .populate("userId", "fullName email")
      .sort({ submittedAt: -1 });
    res.status(200).json({ submissions });
  } catch (error) {
    console.error("Get submissions error:", error);
    res.status(500).json({ message: "Server error" });
  }
};
