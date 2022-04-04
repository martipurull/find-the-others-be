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
const JWTAuth_1 = __importDefault(require("../../middleware/JWTAuth"));
const http_errors_1 = __importDefault(require("http-errors"));
const cloudinary_1 = require("../utils/cloudinary");
const schema_1 = __importDefault(require("../user/schema"));
const schema_2 = __importDefault(require("./schema"));
const schema_3 = __importDefault(require("../project/schema"));
const comments_1 = __importDefault(require("./comments"));
const postRouter = (0, express_1.Router)({ mergeParams: true });
postRouter.post('/', JWTAuth_1.default, cloudinary_1.parser.single('postImage'), (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b, _c, _d, _e, _f;
    try {
        const sender = yield schema_1.default.findById((_a = req.payload) === null || _a === void 0 ? void 0 : _a._id);
        if (!sender)
            return next((0, http_errors_1.default)(404, `User with id ${(_b = req.payload) === null || _b === void 0 ? void 0 : _b._id} could not be found.`));
        if (req.params.projectId) {
            const project = yield schema_3.default.findById(req.params.projectId);
            const newPost = yield new schema_2.default(Object.assign(Object.assign({}, req.body), { sender: sender._id, isForProject: project ? true : false, postProject: project ? project : '', image: ((_c = req.file) === null || _c === void 0 ? void 0 : _c.path) || '', filename: ((_d = req.file) === null || _d === void 0 ? void 0 : _d.filename) || '' })).save();
            const projectWithNewPost = yield schema_3.default.findByIdAndUpdate(req.params.projectId, { $push: { projectPosts: newPost._id } }, { new: true })
                .populate({ path: 'projectPosts', select: ['text', 'image', 'likes', 'comments'], populate: { path: 'sender', select: ['firstName', 'lastName', 'avatar'] } });
            if (!projectWithNewPost)
                return next((0, http_errors_1.default)(404, `Project with id ${req.params.projectId} could not be found.`));
            res.status(201).send(projectWithNewPost);
        }
        else {
            const newPost = yield new schema_2.default(Object.assign({ sender: sender._id, image: ((_e = req.file) === null || _e === void 0 ? void 0 : _e.path) || '', filename: ((_f = req.file) === null || _f === void 0 ? void 0 : _f.filename) || '' }, req.body)).save();
            res.status(201).send(newPost);
        }
    }
    catch (error) {
        next(error);
    }
}));
postRouter.get('/', JWTAuth_1.default, (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    var _g, _h;
    try {
        const loggedInUser = yield schema_1.default.findById((_g = req.payload) === null || _g === void 0 ? void 0 : _g._id);
        if (!loggedInUser)
            return next((0, http_errors_1.default)(404, `User with id ${(_h = req.payload) === null || _h === void 0 ? void 0 : _h._id} could not be found.`));
        if (req.params.projectId) {
            const project = yield schema_3.default.findById(req.params.projectId).populate({ path: 'projectPosts', options: { sort: { 'createdAt': -1 } } });
            if (!project)
                return next((0, http_errors_1.default)(404, `Project with id ${req.params.projectId} cannot be found.`));
            res.send(project.projectPosts);
        }
        else {
            const posts = yield schema_2.default.find({
                $or: [
                    { sender: { $in: loggedInUser.connections.map(connection => connection._id) } },
                    { sender: loggedInUser }
                ]
            })
                .sort({ createdAt: -1 })
                .populate('sender', ['firstName', 'lastName', 'avatar', 'memberOf'])
                .populate({ path: 'comments', sort: { createdAt: -1 }, populate: { path: 'sender', select: ['firstName', 'lastName', 'avatar'] } })
                .limit(100);
            const postsForUser = posts.filter(p => p.isForProject === false);
            res.send(postsForUser);
        }
    }
    catch (error) {
        next(error);
    }
}));
postRouter.put('/:postId', JWTAuth_1.default, cloudinary_1.parser.single('postImage'), (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    var _j, _k, _l, _m, _o, _p, _q;
    try {
        const sender = yield schema_1.default.findById((_j = req.payload) === null || _j === void 0 ? void 0 : _j._id);
        if (!sender)
            return next((0, http_errors_1.default)(404, `User with id ${(_k = req.payload) === null || _k === void 0 ? void 0 : _k._id} could not be found.`));
        const oldPost = yield schema_2.default.findById(req.params.postId);
        if (oldPost) {
            if (oldPost.sender.toString() !== ((_l = req.payload) === null || _l === void 0 ? void 0 : _l._id))
                return next((0, http_errors_1.default)(401, "You cannot edit someone else's post"));
            if (oldPost.filename && req.file) {
                yield cloudinary_1.cloudinary.uploader.destroy(oldPost.filename);
            }
            if (req.params.projectId) {
                const project = yield schema_3.default.findById(req.params.projectId);
                if (!project)
                    return next((0, http_errors_1.default)(404, `Project with id ${req.params.projectId} cannot be found.`));
                const editedPost = yield schema_2.default.findByIdAndUpdate(req.params.postId, Object.assign(Object.assign({}, req.body), { image: ((_m = req.file) === null || _m === void 0 ? void 0 : _m.path) || oldPost.image, filename: ((_o = req.file) === null || _o === void 0 ? void 0 : _o.filename) || oldPost.filename }), { new: true });
                if (!editedPost)
                    return next((0, http_errors_1.default)(404, `Post with id ${req.params.postId} does not exist.`));
                res.send(editedPost);
            }
            else {
                const body = Object.assign(Object.assign({}, req.body), { image: ((_p = req.file) === null || _p === void 0 ? void 0 : _p.path) || oldPost.image, filename: ((_q = req.file) === null || _q === void 0 ? void 0 : _q.filename) || oldPost.filename });
                const editedPost = yield schema_2.default.findByIdAndUpdate(req.params.postId, body, { new: true });
                if (!editedPost)
                    return next((0, http_errors_1.default)(404, `Post with id ${req.params.postId} does not exist.`));
                res.send(editedPost);
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
postRouter.delete('/:postId', JWTAuth_1.default, (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    var _r;
    try {
        const postToDelete = yield schema_2.default.findById(req.params.postId);
        if (postToDelete) {
            if (postToDelete.sender.toString() !== ((_r = req.payload) === null || _r === void 0 ? void 0 : _r._id))
                return next((0, http_errors_1.default)(401, "You cannot delete someone else's post"));
            const deletedPost = yield schema_2.default.findByIdAndDelete(req.params.postId);
            if (!deletedPost)
                return next((0, http_errors_1.default)(404, `Post with id ${req.params.postId} does not exist.`));
            if (deletedPost.filename) {
                yield cloudinary_1.cloudinary.uploader.destroy(deletedPost.filename);
            }
            if (req.params.projectId) {
                const projectWithoutPost = yield schema_3.default.findByIdAndUpdate(req.params.projectId, { $pull: { projectPosts: deletedPost._id } });
                if (!projectWithoutPost)
                    return next((0, http_errors_1.default)(404, `Project with id ${req.params.projectId} cannot be found.`));
            }
            res.status(204).send();
        }
        else {
            next((0, http_errors_1.default)(404, `Post with id ${req.params.postId} does not exist.`));
        }
    }
    catch (error) {
        next(error);
    }
}));
//like & unlike posts
postRouter.post('/likePost', JWTAuth_1.default, (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    var _s;
    try {
        const user = yield schema_1.default.findById((_s = req.payload) === null || _s === void 0 ? void 0 : _s._id);
        if (!user)
            return next((0, http_errors_1.default)(404, `No user logged in`));
        const { postId } = req.body;
        const userLikesPost = yield schema_2.default.findOne({ $and: [{ _id: postId }, { likes: user._id }] });
        if (userLikesPost) {
            const unlikedPost = yield schema_2.default.findByIdAndUpdate(postId, { $pull: { likes: user._id } });
            if (!unlikedPost)
                return next((0, http_errors_1.default)(404, `Post with id ${postId} does not exist.`));
            res.send("You don't like this post anymore.");
        }
        else {
            const likedPost = yield schema_2.default.findByIdAndUpdate(postId, { $push: { likes: user._id } });
            if (!likedPost)
                return next((0, http_errors_1.default)(404, `Post with id ${postId} does not exist.`));
            res.send('You like this post.');
        }
    }
    catch (error) {
        next(error);
    }
}));
//comments
postRouter.use('/comments', comments_1.default);
exports.default = postRouter;
