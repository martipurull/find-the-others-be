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
const access_1 = __importDefault(require("./access"));
const me_1 = __importDefault(require("./me"));
const connections_1 = __importDefault(require("./connections"));
const JWTAuth_1 = __importDefault(require("../../middleware/JWTAuth"));
const schema_1 = __importDefault(require("./schema"));
const http_errors_1 = __importDefault(require("http-errors"));
const userRouter = (0, express_1.Router)();
userRouter.use('/access', access_1.default);
userRouter.use('/me', me_1.default);
userRouter.use('/connect', connections_1.default);
userRouter.post('/findUsers', JWTAuth_1.default, (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const users = yield schema_1.default.find({ $or: [{ email: req.body.searchTerm }, { firstName: req.body.searchTerm }, { lastName: req.body.searchTerm }, { username: req.body.searchTerm }] });
        if (users.length === 0)
            return next((0, http_errors_1.default)(404, `No users found`));
        res.send(users);
    }
    catch (error) {
        next(error);
    }
}));
userRouter.get('/find/:userId', JWTAuth_1.default, (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const user = yield schema_1.default.findById(req.params.userId);
        if (!user)
            return next((0, http_errors_1.default)(404, `User with id ${req.params.userId} cannot be found`));
        res.send(user);
    }
    catch (error) {
        next(error);
    }
}));
exports.default = userRouter;
