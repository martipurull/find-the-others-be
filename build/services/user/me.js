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
const cloudinary_1 = require("../utils/cloudinary");
const schema_1 = __importDefault(require("./schema"));
const JWTAuth_1 = __importDefault(require("../../middleware/JWTAuth"));
const meRouter = (0, express_1.Router)();
meRouter.get('/', JWTAuth_1.default, (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        if (req.payload) {
            const user = yield schema_1.default.findById(req.payload._id)
                .populate('connections', ['firstName', 'lastName', 'avatar', 'connections'])
                .populate('connectionsReceived', ['firstName', 'lastName', 'avatar', 'connections'])
                .populate('memberOf', ['name', 'avatar', 'followedBy'])
                .populate({ path: 'projects', select: ['title', 'projectImage', 'members'], populate: [{ path: 'members', select: ['firstName', 'lastName'] }, { path: 'bands', select: ['name', 'avatar', 'followedBy'] }] })
                .populate({ path: 'applications', select: ['title', 'project', 'description', 'instrument', 'genre'], populate: { path: 'project', select: ['title'] } })
                .populate({ path: 'bandOffers', select: ['name', 'avatar'], populate: { path: 'members', select: ['firstName', 'lastName'] } });
            user ? res.send(user) : next((0, http_errors_1.default)(404, `User with id ${req.payload._id} was not be found.`));
        }
        else {
            next((0, http_errors_1.default)(400, 'Invalid request.'));
        }
    }
    catch (error) {
        next(error);
    }
}));
meRouter.put('/', JWTAuth_1.default, cloudinary_1.parser.single('userAvatar'), (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b;
    try {
        if (req.payload && !req.body.password) {
            const oldUser = yield schema_1.default.findById(req.payload._id);
            if (oldUser) {
                const body = Object.assign(Object.assign({}, req.body), { avatar: ((_a = req.file) === null || _a === void 0 ? void 0 : _a.path) || oldUser.avatar, filename: ((_b = req.file) === null || _b === void 0 ? void 0 : _b.filename) || oldUser.filename });
                const editedUser = yield schema_1.default.findByIdAndUpdate(req.payload._id, body, { new: true });
                if (!editedUser)
                    return next((0, http_errors_1.default)(404, `User with id ${req.payload._id} was not found.`));
                if (oldUser.filename && req.file) {
                    yield cloudinary_1.cloudinary.uploader.destroy(oldUser.filename);
                }
                res.send(editedUser);
            }
            else {
                next((0, http_errors_1.default)(404, `User with id ${req.payload._id} was not found.`));
            }
        }
        else {
            next((0, http_errors_1.default)(400, 'Invalid request.'));
        }
    }
    catch (error) {
        next(error);
    }
}));
meRouter.delete('/', JWTAuth_1.default, (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        if (req.payload) {
            const deletedUser = yield schema_1.default.findByIdAndDelete(req.payload._id);
            if (!deletedUser)
                return next((0, http_errors_1.default)(404, `User with id ${req.payload._id} was not found.`));
            if (deletedUser.filename) {
                yield cloudinary_1.cloudinary.uploader.destroy(deletedUser.filename);
            }
            res.status(204).send();
        }
        else {
            next((0, http_errors_1.default)(400, 'Invalid request.'));
        }
    }
    catch (error) {
        next(error);
    }
}));
//change password
meRouter.put('/change-password', JWTAuth_1.default, (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        if (req.payload) {
            const newPassword = req.body.password;
            const user = yield schema_1.default.findOne({ _id: req.payload._id });
            if (!user)
                return next((0, http_errors_1.default)(404, `User with id ${req.payload._id} was not found.`));
            user.password = newPassword;
            yield user.save();
            console.log('changed password');
            res.send(user);
        }
        else {
            next((0, http_errors_1.default)(400, 'Invalid request.'));
        }
    }
    catch (error) {
        next(error);
    }
}));
exports.default = meRouter;
