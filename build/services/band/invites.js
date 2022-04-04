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
const JWTAuth_1 = __importDefault(require("../../middleware/JWTAuth"));
const schema_1 = __importDefault(require("./schema"));
const schema_2 = __importDefault(require("../user/schema"));
const email_1 = require("../utils/email");
const bandInviteRouter = (0, express_1.Router)({ mergeParams: true });
bandInviteRouter.post('/send-invite', JWTAuth_1.default, (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b;
    try {
        const isUserBandAdmin = yield schema_1.default.findOne({ $and: [{ _id: req.params.bandId }, { bandAdmins: (_a = req.payload) === null || _a === void 0 ? void 0 : _a._id }] });
        if (isUserBandAdmin) {
            const loggedInUser = yield schema_2.default.findById((_b = req.payload) === null || _b === void 0 ? void 0 : _b._id);
            if (!loggedInUser)
                return next((0, http_errors_1.default)(404, `No logged in user was found.`));
            const invitingBand = yield schema_1.default.findById(req.params.bandId);
            if (!invitingBand)
                return next((0, http_errors_1.default)(404, `Band with id ${req.params.bandId} cannot be found.`));
            const { inviteeId } = req.body;
            const offeringBand = yield schema_1.default.findByIdAndUpdate(req.params.bandId, { $push: { invitationsSent: inviteeId } });
            if (!offeringBand)
                return next((0, http_errors_1.default)(404, `Band with id ${req.params.bandId} cannot be found.`));
            const offeredUser = yield schema_2.default.findByIdAndUpdate(inviteeId, { $push: { bandOffers: req.params.bandId } });
            if (!offeredUser)
                return next((0, http_errors_1.default)(404, `User with id ${inviteeId} cannot be found.`));
            yield (0, email_1.sendBandInvite)(loggedInUser, offeredUser, invitingBand);
            res.send(`You invited ${offeredUser.firstName} ${offeredUser.lastName} to join ${invitingBand.name} as a member.`);
        }
        else {
            next((0, http_errors_1.default)(403, 'You cannot invite musicians to join bands you are not an admin of.'));
        }
    }
    catch (error) {
        next(error);
    }
}));
bandInviteRouter.post('/withdraw-invite', JWTAuth_1.default, (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    var _c, _d;
    try {
        const isUserBandAdmin = yield schema_1.default.findOne({ $and: [{ _id: req.params.bandId }, { bandAdmins: (_c = req.payload) === null || _c === void 0 ? void 0 : _c._id }] });
        if (isUserBandAdmin) {
            const loggedInUser = yield schema_2.default.findById((_d = req.payload) === null || _d === void 0 ? void 0 : _d._id);
            if (!loggedInUser)
                return next((0, http_errors_1.default)(404, `No logged in user was found.`));
            const invitingBand = yield schema_1.default.findById(req.params.bandId);
            if (!invitingBand)
                return next((0, http_errors_1.default)(404, `Band with id ${req.params.bandId} cannot be found.`));
            const { inviteeId } = req.body;
            const offeringBand = yield schema_1.default.findByIdAndUpdate(req.params.bandId, { $pull: { invitationsSent: inviteeId } });
            if (!offeringBand)
                return next((0, http_errors_1.default)(404, `Band with id ${req.params.bandId} cannot be found.`));
            const offeredUser = yield schema_2.default.findByIdAndUpdate(inviteeId, { $pull: { bandOffers: req.params.bandId } });
            if (!offeredUser)
                return next((0, http_errors_1.default)(404, `User with id ${inviteeId} cannot be found.`));
            yield (0, email_1.withdrawBandInvite)(loggedInUser, offeredUser, offeringBand);
            res.send(`You withdrew your invitation to ${offeredUser.firstName} ${offeredUser.lastName}. They can no longer join ${invitingBand.name}.`);
        }
        else {
            next((0, http_errors_1.default)(403, 'You cannot withdraw an invitation to join bands you are not an admin of.'));
        }
    }
    catch (error) {
        next(error);
    }
}));
bandInviteRouter.post('/accept-invite', JWTAuth_1.default, (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    var _e, _f, _g, _h;
    try {
        const hasUserBeenOffered = yield schema_2.default.findOne({ $and: [{ _id: (_e = req.payload) === null || _e === void 0 ? void 0 : _e._id }, { bandOffers: req.params.bandId }] });
        if (hasUserBeenOffered) {
            const loggedInUser = yield schema_2.default.findByIdAndUpdate((_f = req.payload) === null || _f === void 0 ? void 0 : _f._id, { $pull: { bandOffers: req.params.bandId }, $push: { memberOf: req.params.bandId } });
            if (!loggedInUser)
                return next((0, http_errors_1.default)(404, `No logged in user was found.`));
            const invitingBand = yield schema_1.default.findByIdAndUpdate(req.params.bandId, { $pull: { invitationsSent: (_g = req.payload) === null || _g === void 0 ? void 0 : _g._id }, $push: { members: (_h = req.payload) === null || _h === void 0 ? void 0 : _h._id } });
            if (!invitingBand)
                return next((0, http_errors_1.default)(404, `Band with id ${req.params.bandId} cannot be found.`));
            const membersToEmail = yield schema_2.default.find({ memberOf: req.params.bandId });
            if (!membersToEmail)
                return next((0, http_errors_1.default)(404, `No members to email were found for band with id ${req.params.bandId}.`));
            const messageToMembers = `${loggedInUser.firstName} ${loggedInUser.lastName} is now a member of ${invitingBand.name}.`;
            yield (0, email_1.notifyBandMembers)(loggedInUser, membersToEmail, invitingBand, messageToMembers);
            res.send(`${loggedInUser.firstName} ${loggedInUser.lastName} is now a member of ${invitingBand.name}.`);
        }
        else {
            next((0, http_errors_1.default)(403, 'You cannot accept an invitation you have not received.'));
        }
    }
    catch (error) {
        next(error);
    }
}));
bandInviteRouter.post('/decline-invite', JWTAuth_1.default, (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    var _j, _k, _l;
    try {
        const hasUserBeenOffered = yield schema_2.default.findOne({ $and: [{ _id: (_j = req.payload) === null || _j === void 0 ? void 0 : _j._id }, { bandOffers: req.params.bandId }] });
        if (hasUserBeenOffered) {
            const loggedInUser = yield schema_2.default.findByIdAndUpdate((_k = req.payload) === null || _k === void 0 ? void 0 : _k._id, { $pull: { bandOffers: req.params.bandId } });
            if (!loggedInUser)
                return next((0, http_errors_1.default)(404, `No logged in user was found.`));
            const invitingBand = yield schema_1.default.findByIdAndUpdate(req.params.bandId, { $pull: { invitationsSent: (_l = req.payload) === null || _l === void 0 ? void 0 : _l._id } });
            if (!invitingBand)
                return next((0, http_errors_1.default)(404, `Band with id ${req.params.bandId} cannot be found.`));
            const membersToEmail = yield schema_2.default.find({ memberOf: req.params.bandId });
            if (!membersToEmail)
                return next((0, http_errors_1.default)(404, `No members to email were found for band with id ${req.params.bandId}.`));
            const messageToMembers = `${loggedInUser.firstName} ${loggedInUser.lastName} has rejected the invitation to join ${invitingBand.name}.`;
            yield (0, email_1.notifyBandMembers)(loggedInUser, membersToEmail, invitingBand, messageToMembers);
            res.send(`You declined to become a member of ${invitingBand.name}`);
        }
        else {
            next((0, http_errors_1.default)(403, 'You cannot decline an invitation you have not received.'));
        }
    }
    catch (error) {
        next(error);
    }
}));
bandInviteRouter.post('/remove-band-member', JWTAuth_1.default, (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    var _m, _o;
    try {
        const isUserBandAdmin = yield schema_1.default.findOne({ $and: [{ _id: req.params.bandId }, { bandAdmins: (_m = req.payload) === null || _m === void 0 ? void 0 : _m._id }] });
        if (isUserBandAdmin) {
            const loggedInUser = yield schema_2.default.findById((_o = req.payload) === null || _o === void 0 ? void 0 : _o._id);
            if (!loggedInUser)
                return next((0, http_errors_1.default)(404, `No logged in user was found.`));
            const { removedMemberId } = req.body;
            const bandWithoutMember = yield schema_1.default.findByIdAndUpdate(req.params.bandId, { $pull: { members: removedMemberId } });
            if (!bandWithoutMember)
                return next((0, http_errors_1.default)(404, `Band with id ${req.params.bandId} cannot be found.`));
            const memberWithoutBand = yield schema_2.default.findByIdAndUpdate(removedMemberId, { $pull: { memberOf: req.params.bandId } });
            if (!memberWithoutBand)
                return next((0, http_errors_1.default)(404, `User with id ${removedMemberId} cannot be found.`));
            yield (0, email_1.notifyRemovedMember)(loggedInUser, memberWithoutBand, bandWithoutMember);
            res.send(`You have removed ${memberWithoutBand.firstName} ${memberWithoutBand.lastName} from your band ${bandWithoutMember.name}.`);
        }
        else {
            next((0, http_errors_1.default)(403, 'You cannot withdraw an invitation to join bands you are not an admin of.'));
        }
    }
    catch (error) {
        next(error);
    }
}));
exports.default = bandInviteRouter;
