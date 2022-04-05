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
const post_1 = __importDefault(require("../post"));
const schema_1 = __importDefault(require("../user/schema"));
const cloudinary_1 = require("../utils/cloudinary");
const schema_2 = __importDefault(require("./schema"));
const schema_3 = __importDefault(require("../band/schema"));
const schema_4 = __importDefault(require("../gig/schema"));
const task_1 = __importDefault(require("./task"));
const mongoose_1 = __importDefault(require("mongoose"));
const projectRouter = (0, express_1.Router)({ mergeParams: true });
projectRouter.post('/', JWTAuth_1.default, cloudinary_1.parser.single('projectImage'), (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b, _c, _d;
    try {
        const loggedInUser = yield schema_1.default.findById((_a = req.payload) === null || _a === void 0 ? void 0 : _a._id);
        if (!loggedInUser)
            return next((0, http_errors_1.default)(404, `No logged in user was found.`));
        let projectAdminObjectIds = [];
        if (req.body.projectAdminIds)
            projectAdminObjectIds = JSON.parse(req.body.projectAdminIds).map((adminId) => new mongoose_1.default.Types.ObjectId(adminId));
        let memberObjectIds = [];
        if (req.body.memberIds)
            memberObjectIds = JSON.parse(req.body.memberIds).map((memberId) => new mongoose_1.default.Types.ObjectId(memberId));
        let bandObjectIds = [];
        if (req.body.bandIds)
            bandObjectIds = JSON.parse(req.body.bandIds).map((bandId) => new mongoose_1.default.Types.ObjectId(bandId));
        const newProject = new schema_2.default(Object.assign(Object.assign({}, req.body), { projectAdmins: projectAdminObjectIds, members: memberObjectIds, bands: bandObjectIds, projectImage: (_b = req.file) === null || _b === void 0 ? void 0 : _b.path, filename: (_c = req.file) === null || _c === void 0 ? void 0 : _c.filename }));
        newProject.save();
        yield schema_1.default.findByIdAndUpdate((_d = req.payload) === null || _d === void 0 ? void 0 : _d._id, { $push: { projects: newProject._id } });
        res.status(201).send(newProject);
    }
    catch (error) {
        next(error);
    }
}));
projectRouter.get('/', JWTAuth_1.default, (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    var _e;
    try {
        const loggedInUserId = (_e = req.payload) === null || _e === void 0 ? void 0 : _e._id;
        if (!loggedInUserId)
            return next((0, http_errors_1.default)(404, `No logged in user was found.`));
        const userProjects = yield schema_2.default.find({ members: loggedInUserId }).populate('tasks', ['title', 'description']);
        if (!userProjects)
            return next((0, http_errors_1.default)(404, `User with id ${loggedInUserId} has no projects.`));
        res.send(userProjects);
    }
    catch (error) {
        next(error);
    }
}));
projectRouter.get('/:projectId', JWTAuth_1.default, (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const project = yield schema_2.default.findById(req.params.projectId)
            .populate('tasks')
            .populate('members', ['firstName', 'lastName', 'avatar', 'connections'])
            .populate('bands', ['name', '_id', 'avatar', 'noOfFollowers']);
        if (!project)
            return next((0, http_errors_1.default)(404, `Project with id ${req.params.projectId} was not found.`));
        res.send(project);
    }
    catch (error) {
        next(error);
    }
}));
projectRouter.put('/:projectId', JWTAuth_1.default, cloudinary_1.parser.single('projectImage'), (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    var _f;
    try {
        const loggedInUserId = (_f = req.payload) === null || _f === void 0 ? void 0 : _f._id;
        if (!loggedInUserId)
            return next((0, http_errors_1.default)(404, `No logged in user was found.`));
        const project = yield schema_2.default.findById(req.params.projectId);
        if (!project)
            return next((0, http_errors_1.default)(404, `Project with id ${req.params.projectId} cannot be found.`));
        if (project.projectAdmins.map(admin => admin.toString()).includes(loggedInUserId)) {
            let projectAdminObjectIds = [];
            if (req.body.projectAdminIds)
                projectAdminObjectIds = JSON.parse(req.body.projectAdminIds).map((adminId) => new mongoose_1.default.Types.ObjectId(adminId));
            let memberObjectIds = [];
            if (req.body.memberIds)
                memberObjectIds = JSON.parse(req.body.memberIds).map((memberId) => new mongoose_1.default.Types.ObjectId(memberId));
            let bandObjectIds = [];
            if (req.body.bandIds)
                bandObjectIds = JSON.parse(req.body.bandIds).map((bandId) => new mongoose_1.default.Types.ObjectId(bandId));
            const body = Object.assign(Object.assign({}, req.body), { projectAdmins: projectAdminObjectIds, members: memberObjectIds, bands: bandObjectIds });
            const editedProject = yield schema_2.default.findByIdAndUpdate(req.params.projectId, body, { new: true });
            if (!editedProject)
                return next((0, http_errors_1.default)(404, `Project with id ${req.params.projectId} cannot be found.`));
            res.send(editedProject);
        }
        else {
            next((0, http_errors_1.default)(403, 'You cannot edit a project you do not lead.'));
        }
    }
    catch (error) {
        next(error);
    }
}));
projectRouter.delete('/:projectId', JWTAuth_1.default, (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    var _g;
    try {
        const loggedInUserId = (_g = req.payload) === null || _g === void 0 ? void 0 : _g._id;
        if (!loggedInUserId)
            return next((0, http_errors_1.default)(404, `No logged in user was found.`));
        const project = yield schema_2.default.findById(req.params.projectId);
        if (!project)
            return next((0, http_errors_1.default)(404, `Project with id ${req.params.projectId} cannot be found.`));
        if (project.projectAdmins.map(admin => admin.toString()).includes(loggedInUserId)) {
            const deletedProject = yield schema_2.default.findByIdAndDelete(req.params.projectId);
            if (!deletedProject)
                return next((0, http_errors_1.default)(404, `Project with id ${req.params.projectId} cannot be found.`));
            deletedProject.members.map((member) => __awaiter(void 0, void 0, void 0, function* () { return yield schema_1.default.findByIdAndUpdate(member._id, { $pull: { projects: req.params.projectId } }); }));
            res.status(204).send();
        }
        else {
            next((0, http_errors_1.default)(403, 'You cannot delete a project you do not lead.'));
        }
    }
    catch (error) {
        next(error);
    }
}));
//write PUT method to allow anyone, not just project admins to drag cards
projectRouter.put('/:projectId/drag-card', JWTAuth_1.default, (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    var _h;
    try {
        const loggedInUserId = (_h = req.payload) === null || _h === void 0 ? void 0 : _h._id;
        if (!loggedInUserId)
            return next((0, http_errors_1.default)(404, `No logged in user was found.`));
        const project = yield schema_2.default.findById(req.params.projectId);
        if (!project)
            return next((0, http_errors_1.default)(404, `Project with id ${req.params.projectId} cannot be found.`));
        console.log(project.tasks);
        if (project.members.map(member => member.toString()).includes(loggedInUserId)) {
            const taskObjectIds = req.body.taskIds.map((taskId) => new mongoose_1.default.Types.ObjectId(taskId));
            const editedProject = yield schema_2.default.findByIdAndUpdate(req.params.projectId, { tasks: taskObjectIds }, { new: true });
            if (!editedProject)
                return next((0, http_errors_1.default)(404, `Project with id ${req.params.projectId} cannot be found.`));
            console.log(editedProject.tasks);
            res.send(editedProject.tasks);
        }
        else {
            next((0, http_errors_1.default)(403, 'You cannot change tasks in a project you are not a member of.'));
        }
    }
    catch (error) {
        next(error);
    }
}));
//get gigs for a project
projectRouter.get('/:projectId/gigs', JWTAuth_1.default, (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const gigsForProject = yield schema_4.default.find({ project: req.params.projectId }).populate({ path: 'applications', populate: { path: 'applicant', select: ['firstName', 'lastName', 'avatar', 'connections'] } });
        if (!gigsForProject)
            return next((0, http_errors_1.default)(404, `Project with id ${req.params.projectId} was not found.`));
        res.send(gigsForProject);
    }
    catch (error) {
        next(error);
    }
}));
//add and remove track as trackToDate
projectRouter.post('/:projectId/add-trackToDate', JWTAuth_1.default, cloudinary_1.parser.single('audioFile'), (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    var _j, _k, _l;
    try {
        const isUserProjectLeader = yield schema_2.default.findOne({ $and: [{ _id: req.params.projectId }, { projectAdmins: (_j = req.payload) === null || _j === void 0 ? void 0 : _j._id }] });
        if (isUserProjectLeader) {
            if (req.file) {
                const trackToDate = { audiofile: (_k = req.file) === null || _k === void 0 ? void 0 : _k.path, filename: (_l = req.file) === null || _l === void 0 ? void 0 : _l.filename };
                const projectWithNewTrackToDate = yield schema_2.default.findByIdAndUpdate(req.params.projectId, { trackToDate: trackToDate, trackName: req.body.trackName }, { new: true });
                if (!projectWithNewTrackToDate)
                    return next((0, http_errors_1.default)(404, `Project with id ${req.params.projectId} could not be found.`));
                res.send(projectWithNewTrackToDate);
            }
            else {
                next((0, http_errors_1.default)(400, 'You did not provide a new track'));
            }
        }
        else {
            next((0, http_errors_1.default)(403, 'Only a project leader can upload a project track to date.'));
        }
    }
    catch (error) {
        next(error);
    }
}));
projectRouter.delete('/:projectId/remove-trackToDate', JWTAuth_1.default, (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    var _m;
    try {
        const isUserProjectLeader = yield schema_2.default.findOne({ $and: [{ _id: req.params.projectId }, { projectAdmins: (_m = req.payload) === null || _m === void 0 ? void 0 : _m._id }] });
        if (isUserProjectLeader) {
            const trackToDate = { audiofile: '', filename: '' };
            const projectWithoutTrackToDate = yield schema_2.default.findByIdAndUpdate(req.params.projectId, { trackToDate: trackToDate }, { new: true });
            if (!projectWithoutTrackToDate)
                return next((0, http_errors_1.default)(404, `Project with id ${req.params.projectId} cannot be found.`));
            if (projectWithoutTrackToDate.trackToDate.filename) {
                yield cloudinary_1.cloudinary.uploader.destroy(projectWithoutTrackToDate.trackToDate.filename);
            }
            res.status(204).send(projectWithoutTrackToDate);
        }
        else {
            next((0, http_errors_1.default)(403, 'Only a project leader can delete a project track to date.'));
        }
    }
    catch (error) {
        next(error);
    }
}));
//add and remove trackCover
projectRouter.post('/:projectId/add-trackCover', JWTAuth_1.default, cloudinary_1.parser.single('coverFile'), (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    var _o, _p, _q;
    try {
        const isUserProjectLeader = yield schema_2.default.findOne({ $and: [{ _id: req.params.projectId }, { projectAdmins: (_o = req.payload) === null || _o === void 0 ? void 0 : _o._id }] });
        if (isUserProjectLeader) {
            if (req.file) {
                const trackCover = { image: (_p = req.file) === null || _p === void 0 ? void 0 : _p.path, filename: (_q = req.file) === null || _q === void 0 ? void 0 : _q.filename };
                const projectWithNewTrackCover = yield schema_2.default.findByIdAndUpdate(req.params.projectId, { trackCover: trackCover, trackName: req.body.trackName }, { new: true });
                if (!projectWithNewTrackCover)
                    return next((0, http_errors_1.default)(404, `Project with id ${req.params.projectId} could not be found.`));
                res.send(projectWithNewTrackCover);
            }
            else {
                next((0, http_errors_1.default)(400, 'You did not provide a new track cover.'));
            }
        }
        else {
            next((0, http_errors_1.default)(403, 'Only a project leader can upload the track artwork.'));
        }
    }
    catch (error) {
        next(error);
    }
}));
projectRouter.delete('/:projectId/remove-trackCover', JWTAuth_1.default, (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    var _r;
    try {
        const isUserProjectLeader = yield schema_2.default.findOne({ $and: [{ _id: req.params.projectId }, { projectAdmins: (_r = req.payload) === null || _r === void 0 ? void 0 : _r._id }] });
        if (isUserProjectLeader) {
            const trackCover = { image: '', filename: '' };
            const projectWithoutTrackCover = yield schema_2.default.findByIdAndUpdate(req.params.projectId, { trackCover: trackCover }, { new: true });
            if (!projectWithoutTrackCover)
                return next((0, http_errors_1.default)(404, `Project with id ${req.params.projectId} cannot be found.`));
            if (projectWithoutTrackCover.trackCover.filename) {
                yield cloudinary_1.cloudinary.uploader.destroy(projectWithoutTrackCover.trackCover.filename);
            }
            res.send(projectWithoutTrackCover);
        }
        else {
            next((0, http_errors_1.default)(403, 'Only a project leader can delete a project track to date.'));
        }
    }
    catch (error) {
        next(error);
    }
}));
//send completed track to bands for release
projectRouter.post('/:projectId/send-track-to-band', JWTAuth_1.default, (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    var _s;
    try {
        const isUserProjectLeader = yield schema_2.default.findOne({ $and: [{ _id: req.params.projectId }, { projectAdmins: (_s = req.payload) === null || _s === void 0 ? void 0 : _s._id }] });
        if (isUserProjectLeader) {
            const trackToSend = {
                trackName: isUserProjectLeader.trackName,
                track: { audiofile: isUserProjectLeader.trackToDate.audiofile, filename: isUserProjectLeader.trackToDate.filename },
                cover: { image: isUserProjectLeader.trackCover.image, filename: isUserProjectLeader.trackCover.filename }
            };
            isUserProjectLeader.bands.map((band) => __awaiter(void 0, void 0, void 0, function* () { return yield schema_3.default.findByIdAndUpdate(band._id, { $push: { readyTracks: trackToSend } }); }));
            res.send({ sentTrack: trackToSend, project: isUserProjectLeader.title, recipients: isUserProjectLeader.bands });
        }
        else {
            next((0, http_errors_1.default)(403, 'Only a project leader can send the completed track to the project bands.'));
        }
    }
    catch (error) {
        next(error);
    }
}));
//complete project: make inactive
projectRouter.post('/:projectId/complete-project', JWTAuth_1.default, (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    var _t;
    try {
        const isUserProjectLeader = yield schema_2.default.findOne({ $and: [{ _id: req.params.projectId }, { projectAdmins: (_t = req.payload) === null || _t === void 0 ? void 0 : _t._id }] });
        if (isUserProjectLeader) {
            const completedProject = yield schema_2.default.findByIdAndUpdate(req.params.projectId, { isActive: false }, { new: true });
            if (!completedProject)
                return next((0, http_errors_1.default)(404, `Project with id ${req.params.projectId} could not be found.`));
            res.send(completedProject);
        }
        else {
            next((0, http_errors_1.default)(403, 'Only a project leader can mak the project as completed.'));
        }
    }
    catch (error) {
        next(error);
    }
}));
projectRouter.delete('/:projectId/leave-project', JWTAuth_1.default, (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    var _u, _v, _w;
    try {
        const userWithoutProject = yield schema_1.default.findByIdAndUpdate((_u = req.payload) === null || _u === void 0 ? void 0 : _u._id, { $pull: { projects: req.params.projectId } });
        if (!userWithoutProject)
            return next((0, http_errors_1.default)(404, `User with project id ${(_v = req.payload) === null || _v === void 0 ? void 0 : _v._id} cannot not be found.`));
        const projectWithoutUser = yield schema_2.default.findByIdAndUpdate(req.params.projectId, { $pull: { members: (_w = req.payload) === null || _w === void 0 ? void 0 : _w._id } });
        if (!projectWithoutUser)
            return next((0, http_errors_1.default)(404, `Project with id ${req.params.projectId} cannot be found.`));
        res.send('You are no longer a member of this project.');
    }
    catch (error) {
        next(error);
    }
}));
projectRouter.use('/:projectId/posts', post_1.default);
projectRouter.use('/:projectId/tasks', task_1.default);
exports.default = projectRouter;
