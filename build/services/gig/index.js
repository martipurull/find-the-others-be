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
const JWTAuth_1 = __importDefault(require("../../middleware/JWTAuth"));
const http_errors_1 = __importDefault(require("http-errors"));
const schema_1 = __importDefault(require("../user/schema"));
const schema_2 = __importDefault(require("./schema"));
const applications_1 = __importDefault(require("./applications"));
const gigRouter = (0, express_1.Router)({ mergeParams: true });
gigRouter.post('/', JWTAuth_1.default, (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b;
    try {
        const postingUser = yield schema_1.default.findById((_a = req.payload) === null || _a === void 0 ? void 0 : _a._id);
        if (!postingUser)
            return next((0, http_errors_1.default)(404, `User with id ${(_b = req.payload) === null || _b === void 0 ? void 0 : _b._id} was not found`));
        // const gigProjectBandObjectIds = req.body.bandIds.map((bandId: string) => new mongoose.Types.ObjectId(bandId))
        // const projectObjectId = new mongoose.Types.ObjectId(req.body.projectId)
        const newGig = yield new schema_2.default(Object.assign({ postedBy: postingUser._id, project: req.body.projectId, bands: req.body.bandIds }, req.body)).save();
        if (!newGig)
            return next((0, http_errors_1.default)(400, `Invalid request.`));
        const populatedNewGig = yield schema_2.default.findById(newGig._id).populate('postedBy', ['firstName', 'lastName']);
        res.status(201).send(populatedNewGig);
    }
    catch (error) {
        next(error);
    }
}));
gigRouter.get('/', JWTAuth_1.default, (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const limit = parseInt(req.query.limit);
        const page = parseInt(req.query.page);
        const searchTerm = req.query.search;
        if (searchTerm) {
            const gigs = yield schema_2.default.find({ $and: [{ isGigAvailable: true }, { $or: [{ title: searchTerm }, { description: searchTerm }, { genre: searchTerm }, { instrument: searchTerm }, { otherInstrument: searchTerm }, { specifics: searchTerm }] }] })
                .populate({ path: 'project', select: ['title', 'projectImage', 'members', 'bands', '_id'], populate: [{ path: 'members', select: ['firstName', 'lastName'] }, { path: 'bands', select: ['_id', 'name', 'avatar', 'followedBy', 'noOfFollowers'] }] })
                .populate('bands', ['name', 'avatar', 'followedBy', 'noOfFollowers', '_id'])
                .sort({ createdAt: -1 })
                .limit(limit)
                .skip((page - 1) * limit);
            const noOfGigsInDb = yield schema_2.default.countDocuments({ $and: [{ isGigAvailable: true }, { $or: [{ title: searchTerm }, { description: searchTerm }, { genre: searchTerm }, { instrument: searchTerm }, { otherInstrument: searchTerm }, { specifics: searchTerm }] }] });
            res.send({ gigs, noOfGigsInDb });
        }
        else {
            const gigs = yield schema_2.default.find({ isGigAvailable: true })
                .populate({ path: 'project', select: ['title', 'projectImage', 'members', 'bands', '_id'], populate: [{ path: 'members', select: ['firstName', 'lastName'] }, { path: 'bands', select: ['_id', 'name', 'avatar', 'followedBy', 'noOfFollowers'] }] })
                .populate('bands', ['name', 'avatar', 'followedBy', 'noOfFollowers', '_id'])
                .sort({ createdAt: -1 })
                .limit(limit)
                .skip((page - 1) * limit);
            const noOfGigsInDb = yield schema_2.default.countDocuments({ isGigAvailable: true });
            res.send({ gigs, noOfGigsInDb });
        }
    }
    catch (error) {
        next(error);
    }
}));
//get all gigs posted by logged-in user
gigRouter.get('/my-gigs', JWTAuth_1.default, (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    var _c;
    try {
        const gigs = yield schema_2.default.find({ postedBy: (_c = req.payload) === null || _c === void 0 ? void 0 : _c._id }).populate('project', ['title', '_id']).populate('bands', ['name', '_id']);
        res.send(gigs);
    }
    catch (error) {
        next(error);
    }
}));
gigRouter.get('/:gigId', JWTAuth_1.default, (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const gig = yield schema_2.default.findById(req.params.gigId)
            .populate('project', ['title', '_id'])
            .populate('bands', ['name', '_id'])
            .populate('postedBy', ['firstName', 'lastName', '_id'])
            .populate({ path: 'applications', populate: { path: 'applicant', select: ['firstName', 'lastName'] } });
        if (!gig)
            return next((0, http_errors_1.default)(404, `Gig with id ${req.params.gigId} could not be found`));
        res.send(gig);
    }
    catch (error) {
        next(error);
    }
}));
gigRouter.put('/:gigId', JWTAuth_1.default, (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const editedGig = yield schema_2.default.findByIdAndUpdate(req.params.gigId, req.body, { new: true });
        if (!editedGig)
            return next((0, http_errors_1.default)(404, `Gig with id ${req.params.gigId} could not be found.`));
        res.send(editedGig);
    }
    catch (error) {
        next(error);
    }
}));
gigRouter.delete('/:gigId', JWTAuth_1.default, (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const deletedGig = yield schema_2.default.findByIdAndDelete(req.params.gigId);
        if (!deletedGig)
            return next((0, http_errors_1.default)(404, `Gig with id ${req.params.gigId} could not be found or has already been deleted.`));
        res.status(204).send();
    }
    catch (error) {
        next(error);
    }
}));
gigRouter.use('/:gigId/applications', applications_1.default);
exports.default = gigRouter;
