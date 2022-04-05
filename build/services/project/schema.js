"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importDefault(require("mongoose"));
const { Schema, model } = mongoose_1.default;
const ProjectModel = new Schema({
    title: { type: String, required: true },
    projectAdmins: [{ type: Schema.Types.ObjectId, ref: 'User' }],
    members: [{ type: Schema.Types.ObjectId, ref: 'User' }],
    description: { type: String, required: true },
    projectImage: { type: String },
    filename: { type: String },
    dueDate: Date,
    trackToDate: {
        audiofile: String,
        filename: String
    },
    trackCover: {
        image: String,
        filename: String
    },
    trackName: String,
    bands: [{ type: Schema.Types.ObjectId, ref: 'Band' }],
    projectPosts: [{ type: Schema.Types.ObjectId, ref: 'Post' }],
    tasks: [{ type: Schema.Types.ObjectId, ref: 'Task' }],
    isActive: { type: Boolean, required: true, default: true }
}, { timestamps: true });
exports.default = model('Project', ProjectModel);
