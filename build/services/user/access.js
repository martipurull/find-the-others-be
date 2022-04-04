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
const schema_1 = __importDefault(require("./schema"));
const functions_1 = require("../../auth/functions");
const cloudinary_1 = require("../utils/cloudinary");
const passport_1 = __importDefault(require("passport"));
const functions_2 = require("../../auth/functions");
const http_errors_1 = __importDefault(require("http-errors"));
const accessRouter = (0, express_1.Router)();
process.env.TS_NODE_DEV && require('dotenv').config();
const { NODE_ENV, FE_URL } = process.env;
accessRouter.post('/check-username', (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const isUsernameTaken = yield schema_1.default.findOne({ username: req.body.username });
        if (isUsernameTaken)
            return next((0, http_errors_1.default)(400, 'This username is already taken.'));
        res.send('This username is available.');
    }
    catch (error) {
        next(error);
    }
}));
accessRouter.post('/register', cloudinary_1.parser.single('userAvatar'), (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b;
    try {
        const isEmailTaken = yield schema_1.default.findOne({ email: req.body.email });
        if (!isEmailTaken) {
            const { firstName, lastName } = req.body;
            const newUser = new schema_1.default(Object.assign(Object.assign({}, req.body), { avatar: ((_a = req.file) === null || _a === void 0 ? void 0 : _a.path) || `https://ui-avatars.com/api/?name=${firstName}+${lastName}`, filename: (_b = req.file) === null || _b === void 0 ? void 0 : _b.filename }));
            yield newUser.save();
            const { accessJWT, refreshJWT } = yield (0, functions_1.provideTokens)(newUser);
            res.cookie('accessToken', accessJWT, { httpOnly: true, secure: NODE_ENV === 'production' ? true : false, sameSite: NODE_ENV === 'production' ? 'none' : undefined });
            res.cookie('refreshToken', refreshJWT, { httpOnly: true, secure: NODE_ENV === 'production' ? true : false, sameSite: NODE_ENV === 'production' ? 'none' : undefined });
            res.status(201).send(newUser);
        }
        else {
            next((0, http_errors_1.default)(400, 'The email provided is already taken.'));
        }
    }
    catch (error) {
        next(error);
    }
}));
accessRouter.post('/login', (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { email, password } = req.body;
        const user = yield schema_1.default.authenticate(email, password);
        if (user) {
            const { accessJWT, refreshJWT } = yield (0, functions_1.provideTokens)(user);
            res.cookie('accessToken', accessJWT, { httpOnly: true, secure: NODE_ENV === 'production' ? true : false, sameSite: NODE_ENV === 'production' ? 'none' : undefined });
            res.cookie('refreshToken', refreshJWT, { httpOnly: true, secure: NODE_ENV === 'production' ? true : false, sameSite: NODE_ENV === 'production' ? 'none' : undefined });
            res.send('Token sent.');
        }
        else {
            next((0, http_errors_1.default)(401, 'Invalid credentials.'));
        }
    }
    catch (error) {
        next(error);
    }
}));
accessRouter.post('/refresh-token', (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { refreshToken } = req.cookies;
        const { accessJWT, refreshJWT } = yield (0, functions_2.verifyJWTAndRegenerate)(refreshToken);
        res.cookie('accessToken', accessJWT, { httpOnly: true, secure: NODE_ENV === 'production' ? true : false, sameSite: NODE_ENV === 'production' ? 'none' : undefined });
        res.cookie('refreshToken', refreshJWT, { httpOnly: true, secure: NODE_ENV === 'production' ? true : false, sameSite: NODE_ENV === 'production' ? 'none' : undefined });
        console.log('new tokens sent!');
        res.send('New tokens sent.');
    }
    catch (error) {
        console.log(error);
        next(error);
    }
}));
accessRouter.get('/facebookLogin', passport_1.default.authenticate('facebook', { scope: 'email' }));
accessRouter.get('/facebookRedirect', passport_1.default.authenticate('facebook', { failureRedirect: `${FE_URL}/register` }), (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        res.cookie('accessToken', req.user.tokens.accessJWT, { httpOnly: true, secure: NODE_ENV === 'production' ? true : false, sameSite: NODE_ENV === 'production' ? 'none' : undefined });
        res.cookie('refreshToken', req.user.tokens.refreshJWT, { httpOnly: true, secure: NODE_ENV === 'production' ? true : false, sameSite: NODE_ENV === 'production' ? 'none' : undefined });
        res.cookie('facebookId', req.user.facebookId, { httpOnly: true, secure: NODE_ENV === 'production' ? true : false, sameSite: NODE_ENV === 'production' ? 'none' : undefined });
        res.redirect(FE_URL);
    }
    catch (error) {
        next(error);
    }
}));
accessRouter.get('/googleLogin', passport_1.default.authenticate('google', { scope: ['profile', 'email'] }));
accessRouter.get('/googleRedirect', passport_1.default.authenticate('google'), (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        res.cookie('accessToken', req.user.tokens.accessJWT, { httpOnly: true, secure: NODE_ENV === 'production' ? true : false, sameSite: NODE_ENV === 'production' ? 'none' : undefined });
        res.cookie('refreshToken', req.user.tokens.refreshJWT, { httpOnly: true, secure: NODE_ENV === 'production' ? true : false, sameSite: NODE_ENV === 'production' ? 'none' : undefined });
        res.redirect(FE_URL);
    }
    catch (error) {
        next(error);
    }
}));
exports.default = accessRouter;
