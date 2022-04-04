"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importDefault(require("mongoose"));
const { Schema, model } = mongoose_1.default;
const NoteSchema = new Schema({
    sender: { type: Schema.Types.ObjectId, ref: 'User' },
    text: String
}, { timestamps: true });
const TaskModel = new Schema({
    status: { type: String, required: true, enum: ['todo', 'doing', 'done'], default: 'todo' },
    musicians: [{ type: Schema.Types.ObjectId, ref: 'User' }],
    title: { type: String, required: true },
    description: String,
    audioFile: String,
    filename: String,
    notes: { type: [NoteSchema], default: [] }
});
exports.default = model('Task', TaskModel);
