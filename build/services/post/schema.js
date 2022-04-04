"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importDefault(require("mongoose"));
const { Schema, model } = mongoose_1.default;
const CommentSchema = new Schema({
    sender: { type: Schema.Types.ObjectId, ref: 'User' },
    text: { type: String, required: true },
    likes: [{ type: Schema.Types.ObjectId, ref: 'User', default: [] }]
}, { timestamps: true, toJSON: { virtuals: true } });
const PostModel = new Schema({
    sender: { type: Schema.Types.ObjectId, ref: 'User' },
    isForProject: { type: Boolean, default: false },
    postProject: { type: Schema.Types.ObjectId, ref: 'Project' },
    text: { type: String, required: true },
    image: String,
    filename: String,
    likes: [{ type: Schema.Types.ObjectId, ref: 'User', default: [] }],
    comments: { type: [CommentSchema], default: [] }
}, { timestamps: true, toJSON: { virtuals: true } });
PostModel.virtual('noOfPostLikes').get(function () { return this.likes.length; });
CommentSchema.virtual('noOfCommentLikes').get(function () { return this.likes.length; });
exports.default = model('Post', PostModel);
