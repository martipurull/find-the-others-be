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
const passport_1 = __importDefault(require("passport"));
const passport_google_oauth20_1 = require("passport-google-oauth20");
const schema_1 = __importDefault(require("../services/user/schema"));
const functions_1 = require("./functions");
process.env.TS_NODE_DEV && require('dotenv').config();
const { GOOGLE_OAUTH_ID, GOOGLE_OAUTH_SECRET, FE_REMOTE_URL } = process.env;
const googleStrategy = new passport_google_oauth20_1.Strategy({
    clientID: GOOGLE_OAUTH_ID,
    clientSecret: GOOGLE_OAUTH_SECRET,
    callbackURL: `${FE_REMOTE_URL}/user/googleRedirect`
}, (accessToken, refreshToken, profile, passportNext) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b;
    try {
        const user = yield schema_1.default.findOne({ googleId: profile.id });
        if (user) {
            const tokens = yield (0, functions_1.provideTokens)(user);
            passportNext(null, { tokens });
        }
        else {
            const newUser = new schema_1.default({
                firstName: (_a = profile.name) === null || _a === void 0 ? void 0 : _a.givenName,
                lastName: (_b = profile.name) === null || _b === void 0 ? void 0 : _b.familyName,
                email: profile.emails[0].value,
                googleId: profile.id,
                avatar: profile._json.picture
            });
            yield newUser.save();
            const tokens = yield (0, functions_1.provideTokens)(newUser);
            passportNext(null, { tokens });
        }
    }
    catch (error) {
        throw (0, http_errors_1.default)(`The following error ocurred: ${error}`);
    }
}));
passport_1.default.serializeUser(function (data, passportNext) {
    passportNext(null, data);
});
exports.default = googleStrategy;
