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
const schema_1 = __importDefault(require("./schema"));
const JWTAuth_1 = __importDefault(require("../../middleware/JWTAuth"));
const connectionRouter = (0, express_1.Router)({ mergeParams: true });
connectionRouter.post('/send-connection', JWTAuth_1.default, (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const { connectionId } = req.body;
        const userId = (_a = req.payload) === null || _a === void 0 ? void 0 : _a._id;
        if (connectionId === userId)
            return next((0, http_errors_1.default)(400, 'You cannot connect with yourself.'));
        const connectionRecipient = yield schema_1.default.findByIdAndUpdate(connectionId, { $push: { connectionsReceived: userId } });
        if (!connectionRecipient)
            return next((0, http_errors_1.default)(404, `User with id ${connectionId} was not found.`));
        const connectionSender = yield schema_1.default.findByIdAndUpdate(userId, { $push: { connectionsSent: connectionId } });
        if (!connectionSender)
            return next((0, http_errors_1.default)(404, `User with id ${userId} was not found.`));
        res.send(`You have sent a connection request to user with id ${connectionId}`);
    }
    catch (error) {
        next(error);
    }
}));
connectionRouter.post('/withdraw-connection', JWTAuth_1.default, (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    var _b;
    try {
        const { connectionId } = req.body;
        const userId = (_b = req.payload) === null || _b === void 0 ? void 0 : _b._id;
        if (connectionId === userId)
            return next((0, http_errors_1.default)(400, 'You cannot withdraw a connection with yourself.'));
        const disconnectionRecipient = yield schema_1.default.findByIdAndUpdate(connectionId, { $pull: { connectionsReceived: userId } });
        if (!disconnectionRecipient)
            return next((0, http_errors_1.default)(404, `User with id ${connectionId} was not found.`));
        const disconnectionSender = yield schema_1.default.findByIdAndUpdate(userId, { $pull: { connectionsSent: connectionId } });
        if (!disconnectionSender)
            return next((0, http_errors_1.default)(404, `User with id ${userId} was not found.`));
        res.send(`You have withdrawn your connection request to user with id ${connectionId}`);
    }
    catch (error) {
        next(error);
    }
}));
connectionRouter.post('/accept-connection', JWTAuth_1.default, (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    var _c;
    try {
        const { connectionId } = req.body;
        const userId = (_c = req.payload) === null || _c === void 0 ? void 0 : _c._id;
        const isIdInConnectionsReceived = yield schema_1.default.findOne({ $and: [{ _id: userId }, { connectionsReceived: connectionId }] });
        if (isIdInConnectionsReceived) {
            const acceptingUser = yield schema_1.default.findByIdAndUpdate(userId, { $pull: { connectionsReceived: connectionId }, $push: { connections: connectionId } });
            if (!acceptingUser)
                return next((0, http_errors_1.default)(404, `The user with id ${userId} was not found.`));
            const acceptedUser = yield schema_1.default.findByIdAndUpdate(connectionId, { $pull: { connectionsSent: userId }, $push: { connections: userId } });
            if (!acceptedUser)
                return next((0, http_errors_1.default)(404, `The user with id ${connectionId} was not found.`));
            res.send(`New connection established between user with id ${userId} and user with id ${connectionId}`);
        }
        else {
            next((0, http_errors_1.default)(403, 'You cannot accept a connection request you have not received.'));
        }
    }
    catch (error) {
        next(error);
    }
}));
connectionRouter.post('/decline-connection', JWTAuth_1.default, (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    var _d;
    try {
        const { connectionId } = req.body;
        const userId = (_d = req.payload) === null || _d === void 0 ? void 0 : _d._id;
        const isIdInConnectionsReceived = yield schema_1.default.findOne({ $and: [{ _id: userId }, { connectionsReceived: connectionId }] });
        if (isIdInConnectionsReceived) {
            const decliningUser = yield schema_1.default.findByIdAndUpdate(userId, { $pull: { connectionsReceived: connectionId } });
            if (!decliningUser)
                return next((0, http_errors_1.default)(404, `The user with id ${userId} cannot be found.`));
            const declinedUser = yield schema_1.default.findByIdAndUpdate(connectionId, { $pull: { connectionsSent: userId } });
            if (!declinedUser)
                return next((0, http_errors_1.default)(404, `User with id ${connectionId} was not found.`));
            res.send(`You've declined the connection request from user with id ${connectionId}.`);
        }
        else {
            next((0, http_errors_1.default)(403, 'You cannot decline a connection request you have not received.'));
        }
    }
    catch (error) {
        next(error);
    }
}));
connectionRouter.post('/remove-connection', JWTAuth_1.default, (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    var _e;
    try {
        const { connectionId } = req.body;
        const userId = (_e = req.payload) === null || _e === void 0 ? void 0 : _e._id;
        const unconnectingUser = yield schema_1.default.findByIdAndUpdate(userId, { $pull: { connections: connectionId } });
        if (!unconnectingUser)
            return next((0, http_errors_1.default)(404, `The user with id ${userId} cannot be found.`));
        const unconnectedUser = yield schema_1.default.findByIdAndUpdate(connectionId, { $pull: { connections: userId } });
        if (!unconnectedUser)
            return next((0, http_errors_1.default)(404, `User with id ${connectionId} was not found.`));
        res.send(`You are no longer connected with user with id ${connectionId}.`);
    }
    catch (error) {
        next(error);
    }
}));
exports.default = connectionRouter;
