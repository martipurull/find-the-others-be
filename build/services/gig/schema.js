"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importDefault(require("mongoose"));
const { Schema, model } = mongoose_1.default;
const ApplicationSchema = new Schema({
    applicant: { type: Schema.Types.ObjectId, ref: 'User' },
    submission: {
        audioFile: String,
        filename: String,
        notes: String
    }
}, { timestamps: true });
const GigModel = new Schema({
    title: { type: String, required: true },
    postedBy: { type: Schema.Types.ObjectId, required: true, ref: 'User' },
    project: { type: Schema.Types.ObjectId, required: true, ref: 'Project' },
    bands: [{ type: Schema.Types.ObjectId, ref: 'Band' }],
    description: { type: String, required: true },
    genre: { type: String, required: true },
    hours: { type: Number, required: true },
    instrument: { type: String, required: true, enum: ['bass', 'brass', 'drums', 'guitar', 'keys', 'mastering', 'mixing', 'percussion', 'strings', 'vocals', 'wind'] },
    otherInstrument: String,
    specifics: String,
    applications: [ApplicationSchema],
    isGigAvailable: { type: Boolean, default: true }
}, { timestamps: true, toJSON: { virtuals: true } });
GigModel.virtual('noOfApplications').get(function () { return this.applications.length; });
exports.default = model('Gig', GigModel);
