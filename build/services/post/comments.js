"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const http_errors_1 = __importDefault(require("http-errors"));
const JWTAuth_1 = __importDefault(require("../../middleware/JWTAuth"));
const schema_1 = __importDefault(require("../user/schema"));
const schema_2 = __importDefault(require("../post/schema"));
const commentsRouter = (0, express_1.Router)({ mergeParams: true });
commentsRouter.post('/', JWTAuth_1.default, (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b;
    try {
        const commenter = yield schema_1.default.findById((_a = req.payload) === null || _a === void 0 ? void 0 : _a._id);
        if (!commenter)
            return next((0, http_errors_1.default)(404, `User with id ${(_b = req.payload) === null || _b === void 0 ? void 0 : _b._id} could not be found.`));
        const { postId } = req.body;
        const comment = { sender: commenter._id, text: req.body.text };
        const postWithComment = yield schema_2.default.findByIdAndUpdate(postId, { $push: { comments: comment } }, { new: true });
        if (!postWithComment)
            return next((0, http_errors_1.default)(404, `Post with id ${postId} does not exist.`));
        res.send(postWithComment);
    }
    catch (error) {
        next(error);
    }
}));
commentsRouter.get('/', JWTAuth_1.default, (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const post = yield schema_2.default.findById(req.params.postId);
        if (!post)
            return next((0, http_errors_1.default)(404, `Post with id ${req.params.postId} does not exist.`));
        res.send(post.comments);
    }
    catch (error) {
        next(error);
    }
}));
commentsRouter.put('/:commentId', JWTAuth_1.default, (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    var _c;
    try {
        const post = yield schema_2.default.findById(req.params.postId);
        if (post) {
            const commentIndex = (_c = post.comments) === null || _c === void 0 ? void 0 : _c.findIndex(c => c._id.toString() === req.params.commentId);
            if (commentIndex && commentIndex !== -1) {
                post.comments[commentIndex] = Object.assign(Object.assign({}, post.comments[commentIndex].toObject()), req.body);
                yield post.save();
                res.send(post);
            }
            else {
                next((0, http_errors_1.default)(404, `Comment cannot be found.`));
            }
        }
        else {
            next((0, http_errors_1.default)(404, `Post with id ${req.params.postId} does not exist.`));
        }
    }
    catch (error) {
        next(error);
    }
}));
commentsRouter.delete('/:commentId', JWTAuth_1.default, (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const post = yield schema_2.default.findByIdAndUpdate(req.params.postId, { $pull: { comments: { _id: req.params.commentId } } }, { new: true });
        post ? res.send(post) : next((0, http_errors_1.default)(404, `Post with id ${req.params.postId} does not exist.`));
    }
    catch (error) {
        next(error);
    }
}));
//like and unlike comments
commentsRouter.post('/likeComment', JWTAuth_1.default, (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const user = yield schema_1.default.findById(req.payload._id);
        if (!user)
            return next((0, http_errors_1.default)(404, `No user logged in`));
        const { postId } = req.body;
        const { commentId } = req.body;
        const post = yield schema_2.default.findById(postId);
        if (!post)
            return next((0, http_errors_1.default)(404, `Post with id ${postId} does not exist.`));
        if (post.comments && post.comments.length > 0) {
            const commentIndex = post.comments.findIndex(c => c._id.toString() === commentId);
            if (commentIndex !== -1) {
                let userLikesComment = false;
                post.comments[commentIndex].likes.forEach(likerId => likerId.toString() === user._id.toString() ? userLikesComment = true : userLikesComment = false);
                if (userLikesComment) {
                    const remainingLikes = post.comments[commentIndex].likes.filter(liker => liker._id.toString() !== user._id.toString());
                    post.comments[commentIndex].likes = remainingLikes;
                    post.save();
                    res.send({ message: "You no longer like this comment.", comment: post.comments[commentIndex] });
                }
                else {
                    post.comments[commentIndex].likes.push(user._id);
                    post.save();
                    res.send({ message: 'You like this comment.', comment: post.comments[commentIndex] });
                }
            }
            else {
                next((0, http_errors_1.default)(404, `Comment with id ${commentId} does not exist.`));
            }
        }
        else {
            next((0, http_errors_1.default)(404, `Post with id ${postId} has no comments.`));
        }
    }
    catch (error) {
        next(error);
    }
}));
exports.default = commentsRouter;
