import mongoose, { Schema, Document } from "mongoose";

export interface ITimeSlot {
    startTime: string;
    endTime: string;
    isBooked: boolean;
    maxBookings: number;
}

export interface ISchedule extends Document {
    date: Date;
    timeSlots: ITimeSlot[];
    timezone: string;
    isActive: boolean;
    createdBy: mongoose.Types.ObjectId;
    createdAt: Date;
    updatedAt: Date;
}

const timeSlotSchema = new Schema<ITimeSlot>(
    {
        startTime: { type: String, required: true },
        endTime: { type: String, required: true },
        isBooked: { type: Boolean, default: false },
        maxBookings: { type: Number, default: 1 },
    },
    { _id: false }
);

const scheduleSchema = new Schema<ISchedule>(
    {
        date: { type: Date, required: true },
        timeSlots: { type: [timeSlotSchema], required: true, default: [] },
        timezone: { type: String, default: "Canada/Eastern" },
        isActive: { type: Boolean, default: true },
        createdBy: { type: Schema.Types.ObjectId, ref: "Admin" },
    },
    { timestamps: true }
);

// Index for efficient queries
scheduleSchema.index({ date: 1, isActive: 1 });

export default mongoose.model<ISchedule>("Schedule", scheduleSchema);
