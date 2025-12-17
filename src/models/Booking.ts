import mongoose, { Schema, Document } from "mongoose";

export interface IBookingDetails {
    country: string;
    age: string;
    preferredLanguage: string;
    purpose: string;
    consultationType: string;
}

export interface IGuestInfo {
    fullName: string;
    email: string;
    phone: string;
}

export interface ICustomRequest {
    requestedDates: Date[];
    requestedTimes: string[];
    message: string;
}

export interface IBooking extends Document {
    user: mongoose.Types.ObjectId | null;
    guestInfo?: IGuestInfo;
    schedule: mongoose.Types.ObjectId | null;
    date: Date;
    timeSlot: {
        startTime: string;
        endTime: string;
    };
    bookingType: "scheduled" | "custom";
    status: "pending" | "confirmed" | "completed" | "cancelled";
    customRequest?: ICustomRequest;
    details: IBookingDetails;
    createdAt: Date;
    updatedAt: Date;
}

const bookingDetailsSchema = new Schema<IBookingDetails>(
    {
        country: { type: String, required: true },
        age: { type: String, required: true },
        preferredLanguage: { type: String, required: true },
        purpose: { type: String, required: true },
        consultationType: { type: String, default: "video" },
    },
    { _id: false }
);

const guestInfoSchema = new Schema<IGuestInfo>(
    {
        fullName: { type: String, required: true },
        email: { type: String, required: true },
        phone: { type: String, default: "" },
    },
    { _id: false }
);

const customRequestSchema = new Schema<ICustomRequest>(
    {
        requestedDates: { type: [Date], default: [] },
        requestedTimes: { type: [String], default: [] },
        message: { type: String, default: "" },
    },
    { _id: false }
);

const bookingSchema = new Schema<IBooking>(
    {
        user: { type: Schema.Types.ObjectId, ref: "User", default: null },
        guestInfo: { type: guestInfoSchema },
        schedule: { type: Schema.Types.ObjectId, ref: "Schedule", default: null },
        date: { type: Date, required: true },
        timeSlot: {
            startTime: { type: String, required: true },
            endTime: { type: String, required: true },
        },
        bookingType: {
            type: String,
            enum: ["scheduled", "custom"],
            default: "scheduled",
        },
        status: {
            type: String,
            enum: ["pending", "confirmed", "completed", "cancelled"],
            default: "pending",
        },
        customRequest: { type: customRequestSchema },
        details: { type: bookingDetailsSchema, required: true },
    },
    { timestamps: true }
);

// Index for efficient queries
bookingSchema.index({ user: 1, status: 1 });
bookingSchema.index({ date: 1, status: 1 });
bookingSchema.index({ schedule: 1 });

export default mongoose.model<IBooking>("Booking", bookingSchema);

