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
const mongoose_1 = __importDefault(require("mongoose"));
const bcrypt_1 = __importDefault(require("bcrypt"));
const { Schema, model } = mongoose_1.default;
const UserSchema = new Schema({
    firstName: { type: String, required: true },
    lastName: { type: String, required: true },
    email: { type: String, required: true },
    password: { type: String, required: true },
    username: { type: String, required: true },
    musicianOrFan: { type: String, required: true },
    refreshJWT: String,
    facebookId: String,
    googleId: String,
    avatar: { type: String },
    filename: { type: String },
    memberOf: [{ type: Schema.Types.ObjectId, ref: 'Band' }],
    bandOffers: [{ type: Schema.Types.ObjectId, ref: 'Band' }],
    projects: [{ type: Schema.Types.ObjectId, ref: 'Project' }],
    connections: [{ type: Schema.Types.ObjectId, ref: 'User' }],
    connectionsSent: [{ type: Schema.Types.ObjectId, ref: 'User' }],
    connectionsReceived: [{ type: Schema.Types.ObjectId, ref: 'User' }],
    applications: [{ type: Schema.Types.ObjectId, ref: 'Gig' }],
    followedBands: [{ type: Schema.Types.ObjectId, ref: 'Band' }]
}, { timestamps: true, toJSON: { virtuals: true } });
UserSchema.virtual('noOfConnections').get(function () { return this.connections.length; });
UserSchema.pre('save', function (next) {
    return __awaiter(this, void 0, void 0, function* () {
        const user = this;
        const plainPW = this.password;
        if (user.isModified('password')) {
            const hashedPW = yield bcrypt_1.default.hash(plainPW, 12);
            user.password = hashedPW;
        }
        next();
    });
});
UserSchema.methods.toJSON = function () {
    const userDocument = this;
    const userObj = userDocument.toObject();
    delete userObj.password;
    delete userObj.__v;
    delete userObj.refreshJWT;
    return userObj;
};
UserSchema.statics.authenticate = function (email, plainPW) {
    return __awaiter(this, void 0, void 0, function* () {
        const user = yield this.findOne({ email });
        if (user) {
            const pwMatch = yield bcrypt_1.default.compare(plainPW, user.password);
            if (pwMatch) {
                return user;
            }
            else {
                return null;
            }
        }
        else {
            return null;
        }
    });
};
const UserModel = model('User', UserSchema);
exports.default = UserModel;
