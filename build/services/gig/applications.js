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
const schema_1 = __importDefault(require("../user/schema"));
const schema_2 = __importDefault(require("./schema"));
const schema_3 = __importDefault(require("../project/schema"));
const email_1 = require("../utils/email");
const applicationsRouter = (0, express_1.Router)({ mergeParams: true });
applicationsRouter.post('/apply', JWTAuth_1.default, (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b, _c;
    try {
        const application = { applicant: (_a = req.payload) === null || _a === void 0 ? void 0 : _a._id, submission: req.body.submission };
        const gig = yield schema_2.default.findByIdAndUpdate(req.params.gigId, { $push: { applications: application } });
        if (!gig)
            return next((0, http_errors_1.default)(404, `Gig with id ${req.params.gigId} could not be found.`));
        const applicant = yield schema_1.default.findByIdAndUpdate((_b = req.payload) === null || _b === void 0 ? void 0 : _b._id, { $push: { applications: gig._id } });
        if (!applicant)
            return next((0, http_errors_1.default)(404, `User with id ${(_c = req.payload) === null || _c === void 0 ? void 0 : _c._id} could not be found.`));
        res.send(`You have applied for gig with id ${req.params.gigId}.`);
    }
    catch (error) {
        next(error);
    }
}));
applicationsRouter.post('/withdraw', JWTAuth_1.default, (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    var _d, _e;
    try {
        const applicant = yield schema_1.default.findByIdAndUpdate((_d = req.payload) === null || _d === void 0 ? void 0 : _d._id, { $pull: { applications: req.params.gigId } });
        if (!applicant)
            return next((0, http_errors_1.default)(404, `User with id ${(_e = req.payload) === null || _e === void 0 ? void 0 : _e._id} could not be found.`));
        const gig = yield schema_2.default.findByIdAndUpdate(req.params.gigId, { $pull: { applications: { applicant: applicant._id } } });
        if (!gig)
            return next((0, http_errors_1.default)(404, `Gig with id ${req.params.gigId} could not be found.`));
        res.send(`You have withdrawn your application for gig with id ${req.params.gigId}.`);
    }
    catch (error) {
        next(error);
    }
}));
applicationsRouter.post('/decline', JWTAuth_1.default, (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    var _f, _g, _h;
    try {
        const gigToCheck = yield schema_2.default.findById(req.params.gigId);
        if ((gigToCheck === null || gigToCheck === void 0 ? void 0 : gigToCheck.postedBy.toString()) === ((_f = req.payload) === null || _f === void 0 ? void 0 : _f._id)) {
            const applicantId = req.body.applicantId;
            const rejectedApplicant = yield schema_1.default.findById(applicantId);
            if (!rejectedApplicant)
                return next((0, http_errors_1.default)(404, `User with id ${applicantId} could not be found.`));
            const decliningUser = yield schema_1.default.findByIdAndUpdate((_g = req.payload) === null || _g === void 0 ? void 0 : _g._id, { $pull: { applications: req.params.gigId } });
            if (!decliningUser)
                return next((0, http_errors_1.default)(404, `User with id ${(_h = req.payload) === null || _h === void 0 ? void 0 : _h._id} could not be found.`));
            const gig = yield schema_2.default.findByIdAndUpdate(req.params.gigId, { $pull: { applications: { applicant: rejectedApplicant._id } } });
            if (!gig)
                return next((0, http_errors_1.default)(404, `Gig with id ${req.params.gigId} could not be found.`));
            const project = yield schema_3.default.findById(gig.project._id);
            if (!project)
                return next((0, http_errors_1.default)(404, `Project with ${gig.project._id} could not found.`));
            yield (0, email_1.sendGigRejection)(decliningUser, rejectedApplicant, gig, project);
            res.send(`You have turned down applicant with id ${applicantId} for gig with id ${req.params.gigId}.`);
        }
        else {
            next((0, http_errors_1.default)(403, 'You cannot decline an application for a gig you did not post.'));
        }
    }
    catch (error) {
        next(error);
    }
}));
applicationsRouter.post('/accept', JWTAuth_1.default, (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    var _j, _k, _l;
    try {
        const gigToCheck = yield schema_2.default.findById(req.params.gigId);
        if ((gigToCheck === null || gigToCheck === void 0 ? void 0 : gigToCheck.postedBy.toString()) === ((_j = req.payload) === null || _j === void 0 ? void 0 : _j._id)) {
            const { applicantId } = req.body;
            const acceptingUser = yield schema_1.default.findById((_k = req.payload) === null || _k === void 0 ? void 0 : _k._id);
            const gig = yield schema_2.default.findByIdAndUpdate(req.params.gigId, { isGigAvailable: false });
            if (!gig)
                return next((0, http_errors_1.default)(404, `Gig with id ${req.params.gigId} could not be found.`));
            const project = yield schema_3.default.findByIdAndUpdate(gig.project._id, { $push: { members: applicantId } });
            if (!project)
                return next((0, http_errors_1.default)(404, `Project with id ${gig.project._id} could not be found.`));
            const successfulApplicant = yield schema_1.default.findByIdAndUpdate(applicantId, { $pull: { applications: req.params.gigId }, $push: { projects: project._id } });
            if (!successfulApplicant)
                return next((0, http_errors_1.default)(404, `Applicant with id ${(_l = req.payload) === null || _l === void 0 ? void 0 : _l._id} could not be found.`));
            yield (0, email_1.sendGigConfirmation)(acceptingUser, successfulApplicant, gig, project);
            const remainingApplications = gig.applications.filter(application => application.applicant.toString() !== applicantId);
            const remainingApplicantsIds = remainingApplications.map(application => application.applicant._id.toString());
            const { contactedRejects, unableToContactRejects } = yield (0, email_1.sendGigRejections)(acceptingUser, remainingApplicantsIds, gig, project);
            res.send({ successfulApplicant, contactedRejects, unableToContactRejects });
        }
        else {
            next((0, http_errors_1.default)(403, 'You cannot accept an application for a gig you did not post.'));
        }
    }
    catch (error) {
        next(error);
    }
}));
exports.default = applicationsRouter;
