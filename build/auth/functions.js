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
exports.verifyJWTAndRegenerate = exports.verifyRefreshJWT = exports.verifyJWT = exports.provideTokens = void 0;
const http_errors_1 = __importDefault(require("http-errors"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const schema_1 = __importDefault(require("../services/user/schema"));
process.env.TS_NODE_DEV && require('dotenv').config();
const { JWT_SECRET_KEY, JWT_REFRESH_SECRET_KEY } = process.env;
const generateJWT = (payload) => {
    return new Promise((resolve, reject) => jsonwebtoken_1.default.sign(payload, JWT_SECRET_KEY, { expiresIn: '15m' }, (err, token) => {
        err ? reject(err) : resolve(token);
    }));
};
const generateRefreshJWT = (payload) => {
    return new Promise((resolve, reject) => jsonwebtoken_1.default.sign(payload, JWT_REFRESH_SECRET_KEY, { expiresIn: '1 week' }, (err, token) => {
        err ? reject(err) : resolve(token);
    }));
};
const provideTokens = (user) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const accessJWT = yield generateJWT({ _id: user._id, email: user.email });
        const refreshJWT = yield generateRefreshJWT({ _id: user._id, email: user.email });
        user.refreshJWT = refreshJWT;
        yield user.save();
        return { accessJWT, refreshJWT };
    }
    catch (error) {
        throw (0, http_errors_1.default)(500, `The following error occurred: ${error}`);
    }
});
exports.provideTokens = provideTokens;
const verifyJWT = (token) => {
    return new Promise((resolve, reject) => jsonwebtoken_1.default.verify(token, JWT_SECRET_KEY, (err, payload) => {
        err ? reject(err) : resolve(payload);
    }));
};
exports.verifyJWT = verifyJWT;
const verifyRefreshJWT = (token) => {
    return new Promise((resolve, reject) => jsonwebtoken_1.default.verify(token, JWT_REFRESH_SECRET_KEY, (err, payload) => {
        err ? reject(err) : resolve(payload);
    }));
};
exports.verifyRefreshJWT = verifyRefreshJWT;
const verifyJWTAndRegenerate = (currentRefreshJWT) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const payload = yield (0, exports.verifyRefreshJWT)(currentRefreshJWT);
        const user = yield schema_1.default.findById(payload._id);
        if (!user)
            throw (0, http_errors_1.default)(404, `User with id ${payload._id} does not exist.`);
        const { accessJWT, refreshJWT } = yield (0, exports.provideTokens)(user);
        user.refreshJWT = refreshJWT;
        yield user.save();
        return { accessJWT, refreshJWT };
    }
    catch (error) {
        throw (0, http_errors_1.default)(401, 'Invalid refresh token.');
    }
});
exports.verifyJWTAndRegenerate = verifyJWTAndRegenerate;
