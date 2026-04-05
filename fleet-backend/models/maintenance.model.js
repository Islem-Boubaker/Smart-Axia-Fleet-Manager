import { Schema, model } from "mongoose";

const maintenanceSchema = new Schema({
    vehicle: {
        type: Schema.Types.ObjectId,
        ref: 'Vehicle',
        required: true
    },
    description: {
        type: String,
        required: true
    },
    cost: {
        type: Number,
        required: true
    },
    date: {
        type: Date,
        default: Date.now
    },
    status: {
        type: String,
        enum: ['pending', 'in-progress', 'completed'],
        default: 'pending'
    }
}, { timestamps: true });

const Maintenance = model('Maintenance', maintenanceSchema);

export default Maintenance;
