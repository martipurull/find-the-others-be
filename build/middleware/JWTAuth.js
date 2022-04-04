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
const http_errors_1 = __importDefault(require("http-errors"));
const functions_1 = require("../auth/functions");
const JWTAuth = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    if (!req.cookies.accessToken) {
        next((0, http_errors_1.default)(401, 'No access token provided in cookies.'));
    }
    else {
        try {
            const token = req.cookies.accessToken;
            const payload = (0, functions_1.verifyJWT)(token);
            req.payload = { _id: (yield payload)._id, email: (yield payload).email };
            next();
        }
        catch (error) {
            console.log(error);
            next((0, http_errors_1.default)(401, 'Invalid access token provided in cookies.'));
        }
    }
});
exports.default = JWTAuth;
