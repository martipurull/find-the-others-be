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
const schema_2 = __importDefault(require("../user/schema"));
const JWTAuth_1 = __importDefault(require("../../middleware/JWTAuth"));
const http_errors_1 = __importDefault(require("http-errors"));
const cloudinary_1 = require("../utils/cloudinary");
const invites_1 = __importDefault(require("./invites"));
const mongoose_1 = __importDefault(require("mongoose"));
const bandRouter = (0, express_1.Router)({ mergeParams: true });
bandRouter.post('/', JWTAuth_1.default, cloudinary_1.parser.single('bandAvatar'), (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b, _c, _d;
    try {
        const { name } = req.body;
        const user = yield schema_2.default.findById((_a = req.payload) === null || _a === void 0 ? void 0 : _a._id);
        if (!user)
            return next((0, http_errors_1.default)(404, `No user logged in.`));
        let bandAdminObjectIds = [];
        let memberObjectIds = [];
        if (req.body.bandAdminIds)
            bandAdminObjectIds = JSON.parse(req.body.bandAdminIds).map((bandAdminId) => new mongoose_1.default.Types.ObjectId(bandAdminId));
        if (req.body.memberIds)
            memberObjectIds = JSON.parse(req.body.memberIds).map((memberId) => new mongoose_1.default.Types.ObjectId(memberId));
        const newBand = new schema_1.default(Object.assign(Object.assign({}, req.body), { avatar: ((_b = req.file) === null || _b === void 0 ? void 0 : _b.path) || `https://ui-avatars.com/api/?name=${name}`, filename: (_c = req.file) === null || _c === void 0 ? void 0 : _c.filename, bandAdmins: [...bandAdminObjectIds, user._id], members: [...memberObjectIds, user._id] }));
        yield schema_2.default.findByIdAndUpdate((_d = req.payload) === null || _d === void 0 ? void 0 : _d._id, { $push: { memberOf: newBand._id } });
        yield newBand.save();
        res.status(201).send(newBand);
    }
    catch (error) {
        next(error);
    }
}));
bandRouter.get('/', JWTAuth_1.default, (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const bands = yield schema_1.default.find().populate('members', ['firstName', 'lastName', 'avatar', 'connections', '_id']);
        res.send(bands);
    }
    catch (error) {
        next(error);
    }
}));
//get bands use is a member of
bandRouter.get('/my-bands', JWTAuth_1.default, (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    var _e;
    try {
        if (!((_e = req.payload) === null || _e === void 0 ? void 0 : _e._id))
            return next((0, http_errors_1.default)(404, `No logged in user was found.`));
        const bands = yield schema_1.default.find({ members: req.payload._id }).populate('members', ['firstName', 'lastName', 'avatar', 'connections', '_id']);
        res.send(bands);
    }
    catch (error) {
        next(error);
    }
}));
//get bands logged-in user follows
bandRouter.get('/followed-bands', JWTAuth_1.default, (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    var _f;
    try {
        const bandsUserFollows = yield schema_1.default.find({ followedBy: (_f = req.payload) === null || _f === void 0 ? void 0 : _f._id })
            .populate('members', ['firstName', 'lastName', 'avatar', 'connections'])
            .populate('invitationsSent', ['firstName', 'lastName', 'avatar', 'connections'])
            .populate({ path: 'projects', select: ['title', 'description', 'projectImage', 'members', 'bands'], populate: [{ path: 'members', select: ['firstName', 'lastName'] }, { path: 'bands', select: ['name', 'avatar', 'followedBy', 'noOfFollowers'] }] })
            .populate('bandAdmins');
        res.send(bandsUserFollows);
    }
    catch (error) {
        next(error);
    }
}));
bandRouter.get('/:bandId', JWTAuth_1.default, (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const band = yield schema_1.default.findById(req.params.bandId)
            .populate('bandAdmins')
            .populate('members', ['firstName', 'lastName', 'avatar', 'connections'])
            .populate('invitationsSent', ['firstName', 'lastName', 'avatar', 'connections'])
            .populate({ path: 'projects', select: ['title', 'description', 'projectImage', 'members', 'bands'], populate: [{ path: 'members', select: ['firstName', 'lastName'] }, { path: 'bands', select: ['name', 'avatar', 'followedBy', 'noOfFollowers'] }] });
        if (!band)
            return next((0, http_errors_1.default)(404, `Band with id ${req.params.bandId} cannot be found.`));
        res.send(band);
    }
    catch (error) {
        next(error);
    }
}));
bandRouter.put('/:bandId', JWTAuth_1.default, cloudinary_1.parser.single('bandImage'), (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    var _g, _h, _j;
    try {
        const isUserBandAdmin = yield schema_1.default.findOne({ $and: [{ _id: req.params.bandId }, { bandAdmins: (_g = req.payload) === null || _g === void 0 ? void 0 : _g._id }] });
        if (isUserBandAdmin) {
            const preEditBand = yield schema_1.default.findById(req.params.bandId);
            if (!preEditBand)
                return next((0, http_errors_1.default)(404, `Band with id ${req.params.bandId} cannot be found.`));
            let bandAdminObjectIds = [];
            if (req.body.bandAdminIds)
                bandAdminObjectIds = JSON.parse(req.body.bandAdminIds).map((bandAdminId) => new mongoose_1.default.Types.ObjectId(bandAdminId));
            let memberObjectIds = [];
            if (req.body.memberIds)
                memberObjectIds = JSON.parse(req.body.memberIds).map((memberId) => new mongoose_1.default.Types.ObjectId(memberId));
            const body = Object.assign(Object.assign({}, req.body), { bandAdmins: bandAdminObjectIds, members: memberObjectIds, avatar: ((_h = req.file) === null || _h === void 0 ? void 0 : _h.path) || preEditBand.avatar, filename: ((_j = req.file) === null || _j === void 0 ? void 0 : _j.filename) || preEditBand.filename });
            const editedBand = yield schema_1.default.findByIdAndUpdate(req.params.bandId, body, { new: true });
            if (!editedBand)
                return next((0, http_errors_1.default)(404, `Band with id ${req.params.bandId} cannot be found.`));
            if (preEditBand.filename && req.file) {
                yield cloudinary_1.cloudinary.uploader.destroy(preEditBand.filename);
            }
            res.send(editedBand);
        }
        else {
            next((0, http_errors_1.default)(401, 'You cannot edit bands you are not an admin of.'));
        }
    }
    catch (error) {
        next(error);
    }
}));
bandRouter.delete('/:bandId', JWTAuth_1.default, (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    var _k;
    try {
        const isUserBandAdmin = yield schema_1.default.findOne({ $and: [{ _id: req.params.bandId }, { bandAdmins: (_k = req.payload) === null || _k === void 0 ? void 0 : _k._id }] });
        if (isUserBandAdmin) {
            const deletedBand = yield schema_1.default.findByIdAndDelete(req.params.bandId);
            if (!deletedBand)
                return next((0, http_errors_1.default)(404, `Band with id ${req.params.bandId} cannot be found.`));
            if (deletedBand.filename) {
                yield cloudinary_1.cloudinary.uploader.destroy(deletedBand.filename);
            }
            deletedBand.members.map((member) => __awaiter(void 0, void 0, void 0, function* () { return yield schema_2.default.findByIdAndUpdate(member._id, { $pull: { memberOf: req.params.bandId } }); }));
            res.status(204).send();
        }
        else {
            next((0, http_errors_1.default)(401, 'You cannot delete bands you are not an admin of.'));
        }
    }
    catch (error) {
        next(error);
    }
}));
//follow and unfollow bands
bandRouter.post('/:bandId/follow', JWTAuth_1.default, (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    var _l, _m, _o, _p, _q;
    try {
        const user = yield schema_2.default.findById((_l = req.payload) === null || _l === void 0 ? void 0 : _l._id);
        if (!user)
            return next((0, http_errors_1.default)(404, `No user logged in`));
        const userFollowsBand = yield schema_1.default.findOne({ $and: [{ _id: req.params.bandId }, { followedBy: user._id }] });
        if (userFollowsBand) {
            const unfollowedBand = yield schema_1.default.findByIdAndUpdate(req.params.bandId, { $pull: { followedBy: user._id } });
            if (!unfollowedBand)
                return next((0, http_errors_1.default)(404, `Post with id ${req.params.bandId} does not exist.`));
            const userWithoutBand = yield schema_2.default.findByIdAndUpdate((_m = req.payload) === null || _m === void 0 ? void 0 : _m._id, { $pull: { followedBands: unfollowedBand._id } });
            if (!userWithoutBand)
                return next((0, http_errors_1.default)(404, `User with id ${(_o = req.payload) === null || _o === void 0 ? void 0 : _o._id} does not exist.`));
            res.send("You don't follow this band anymore.");
        }
        else {
            const followedBand = yield schema_1.default.findByIdAndUpdate(req.params.bandId, { $push: { followedBy: user._id } });
            if (!followedBand)
                return next((0, http_errors_1.default)(404, `Post with id ${req.params.bandId} does not exist.`));
            const userWithBand = yield schema_2.default.findByIdAndUpdate((_p = req.payload) === null || _p === void 0 ? void 0 : _p._id, { $push: { followedBands: followedBand._id } });
            if (!userWithBand)
                return next((0, http_errors_1.default)(404, `User with id ${(_q = req.payload) === null || _q === void 0 ? void 0 : _q._id} does not exist.`));
            res.send('You follow this band.');
        }
    }
    catch (error) {
        next(error);
    }
}));
//release track
bandRouter.post('/:bandId/release-track', JWTAuth_1.default, (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    var _r;
    try {
        const isUserBandAdmin = yield schema_1.default.findOne({ $and: [{ _id: req.params.bandId }, { bandAdmins: (_r = req.payload) === null || _r === void 0 ? void 0 : _r._id }] });
        if (isUserBandAdmin) {
            const { trackId } = req.body;
            const trackToRelease = isUserBandAdmin.readyTracks.find(track => track._id.toString() === trackId);
            if (!trackToRelease)
                return next((0, http_errors_1.default)(404, `Track with id ${trackId} cannot be found.`));
            const moveTracks = yield schema_1.default.findByIdAndUpdate(req.params.bandId, { $pull: { readyTracks: { _id: trackId } }, $push: { releasedTracks: trackToRelease } }, { new: true });
            if (!moveTracks)
                return next((0, http_errors_1.default)(404, `Band with id ${req.params.bandId} cannot be found.`));
            res.send(moveTracks);
        }
        else {
            next((0, http_errors_1.default)(403, 'You cannot release songs for bands you are not an admin of.'));
        }
    }
    catch (error) {
        next(error);
    }
}));
//band invites
bandRouter.use('/:bandId', invites_1.default);
exports.default = bandRouter;
