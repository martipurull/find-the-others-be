"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const cookie_parser_1 = __importDefault(require("cookie-parser"));
const passport_1 = __importDefault(require("passport"));
const errorHandler_1 = require("./middleware/errorHandler");
const user_1 = __importDefault(require("./services/user"));
const facebookOAuth_1 = __importDefault(require("./auth/facebookOAuth"));
const googleOAuth_1 = __importDefault(require("./auth/googleOAuth"));
const gig_1 = __importDefault(require("./services/gig"));
const post_1 = __importDefault(require("./services/post"));
const band_1 = __importDefault(require("./services/band"));
const project_1 = __importDefault(require("./services/project"));
const server = (0, express_1.default)();
const whitelist = ['http://localhost:3000', 'https://find-the-others-fe.vercel.app'];
const corsOptions = {
    origin: function (origin, callback) {
        if (whitelist.indexOf(origin) !== -1) {
            callback(null, true);
        }
        else {
            callback(new Error('Not allowed by CORS'));
        }
    },
    credentials: true
};
passport_1.default.use('facebook', facebookOAuth_1.default);
passport_1.default.use('google', googleOAuth_1.default);
server.use((0, cors_1.default)(corsOptions));
server.use(express_1.default.json());
server.use((0, cookie_parser_1.default)());
server.use(passport_1.default.initialize());
// routers go here
server.use('/user', user_1.default);
server.use('/gigs', gig_1.default);
server.use('/posts', post_1.default);
server.use('/bands', band_1.default);
server.use('/projects', project_1.default);
server.use(errorHandler_1.errorHandlers);
exports.default = server;
