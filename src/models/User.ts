import mongoose, { Schema, Document } from "mongoose";

export interface IUser extends Document {
  fullName: string;
  gender: "Male" | "Female" | "Prefer not to say";
  dateOfBirth: Date;
  nationality: string;
  countryOfResidence: string;
  address: {
    line1: string;
    city: string;
    pinCode: string;
  };
  phoneNumber: string;
  email: string;
  password: string;
  highestEducation: string;
  occupation: string;
  reasonForTest: "Higher education abroad" | "Work/immigration" | "Professional registration" | "Personal";
  createdAt: Date;
  updatedAt: Date;
}

const userSchema = new Schema<IUser>(
  {
    fullName: { type: String, required: true, trim: true },
    gender: { type: String, enum: ["Male", "Female", "Prefer not to say"], required: true },
    dateOfBirth: { type: Date, required: true },
    nationality: { type: String, required: true, trim: true },
    countryOfResidence: { type: String, required: true, trim: true },
    address: {
      line1: { type: String, required: true, trim: true },
      city: { type: String, required: true, trim: true },
      pinCode: { type: String, required: true, trim: true },
    },
    phoneNumber: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true },
    password: { type: String, required: true, minlength: 8, select: false },
    highestEducation: { type: String, required: true, trim: true },
    occupation: { type: String, required: true, trim: true },
    reasonForTest: {
      type: String,
      enum: ["Higher education abroad", "Work/immigration", "Professional registration", "Personal"],
      required: true,
    },
  },
  { timestamps: true }
);

export default mongoose.model<IUser>("User", userSchema);
