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
const JWTAuth_1 = __importDefault(require("../../../middleware/JWTAuth"));
const cloudinary_1 = require("../../utils/cloudinary");
const schema_1 = __importDefault(require("../../user/schema"));
const schema_2 = __importDefault(require("../schema"));
const schema_3 = __importDefault(require("../task/schema"));
const mongoose_1 = __importDefault(require("mongoose"));
const taskRouter = (0, express_1.Router)({ mergeParams: true });
taskRouter.post('/', JWTAuth_1.default, cloudinary_1.parser.single('audioFile'), (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b;
    try {
        let musicianObjectIds = [];
        if (req.body.musicians)
            musicianObjectIds = JSON.parse(req.body.musicians).map((musicianId) => new mongoose_1.default.Types.ObjectId(musicianId));
        const newTask = new schema_3.default(Object.assign(Object.assign({}, req.body), { musicians: musicianObjectIds, audioFile: ((_a = req.file) === null || _a === void 0 ? void 0 : _a.path) || '', filename: ((_b = req.file) === null || _b === void 0 ? void 0 : _b.filename) || '' }));
        const projectWithNewTask = yield schema_2.default.findByIdAndUpdate(req.params.projectId, { $push: { tasks: newTask._id } }, { new: true });
        if (!projectWithNewTask)
            return next((0, http_errors_1.default)(404, `Project with id ${req.params.projectId} was not found.`));
        newTask.save();
        res.status(201).send(projectWithNewTask);
    }
    catch (error) {
        next(error);
    }
}));
taskRouter.get('/', JWTAuth_1.default, (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const project = yield schema_2.default.findById(req.params.projectId)
            .populate({ path: 'tasks', populate: { path: 'notes', populate: { path: 'user', select: ['firstName', 'lastName', 'avatar'] } } })
            .populate('members', ['firstName', 'lastName', 'avatar']);
        if (!project)
            return next((0, http_errors_1.default)(404, `Project with id ${req.params.projectId} cannot be found.`));
        res.send(project.tasks);
    }
    catch (error) {
        next(error);
    }
}));
taskRouter.get('/:taskId', JWTAuth_1.default, (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const task = yield schema_3.default.findById(req.params.taskId);
        if (!task)
            return next((0, http_errors_1.default)(404, `Task with id ${req.params.taskId} was not found.`));
        res.send(task);
    }
    catch (error) {
        next(error);
    }
}));
taskRouter.put('/:taskId', JWTAuth_1.default, cloudinary_1.parser.single('audioFile'), (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    var _c, _d, _e, _f;
    try {
        const isUserProjectLeader = yield schema_2.default.findOne({ $and: [{ _id: req.params.projectId }, { leader: (_c = req.payload) === null || _c === void 0 ? void 0 : _c._id }] });
        const isUserTaskMusician = yield schema_3.default.findOne({ $and: [{ _id: req.params.taskId }, { musicians: (_d = req.payload) === null || _d === void 0 ? void 0 : _d._id }] });
        if (isUserProjectLeader || isUserTaskMusician) {
            const oldTask = yield schema_3.default.findById(req.params.taskId);
            if (!oldTask)
                return next((0, http_errors_1.default)(404, `Task with id ${req.params.taskId} was not found.`));
            let musicianObjectIds = [];
            if (req.body.musicians)
                musicianObjectIds = JSON.parse(req.body.musicians).map((musicianId) => new mongoose_1.default.Types.ObjectId(musicianId));
            const body = Object.assign(Object.assign({}, req.body), { musicians: musicianObjectIds, audioFile: ((_e = req.file) === null || _e === void 0 ? void 0 : _e.path) || oldTask.audioFile, filename: ((_f = req.file) === null || _f === void 0 ? void 0 : _f.filename) || oldTask.filename });
            const editedTask = yield schema_3.default.findByIdAndUpdate(req.params.taskId, body, { new: true });
            if (!editedTask)
                return next((0, http_errors_1.default)(404, `Task with id ${req.params.taskId} cannot be found.`));
            if (oldTask.filename && req.file) {
                yield cloudinary_1.cloudinary.uploader.destroy(oldTask.filename);
            }
            res.send(editedTask);
        }
        else {
            next((0, http_errors_1.default)(403, "You're not authorised to edit this task."));
        }
    }
    catch (error) {
        next(error);
    }
}));
taskRouter.delete('/:taskId', JWTAuth_1.default, (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    var _g, _h;
    try {
        const isUserProjectLeader = yield schema_2.default.findOne({ $and: [{ _id: req.params.projectId }, { leader: (_g = req.payload) === null || _g === void 0 ? void 0 : _g._id }] });
        const isUserTaskMusician = yield schema_3.default.findOne({ $and: [{ _id: req.params.taskId }, { musicians: (_h = req.payload) === null || _h === void 0 ? void 0 : _h._id }] });
        if (isUserProjectLeader || isUserTaskMusician) {
            const deletedTask = yield schema_3.default.findByIdAndDelete(req.params.taskId);
            if (!deletedTask)
                return next((0, http_errors_1.default)(404, `Task with id ${req} was not found.`));
            if (deletedTask.filename) {
                yield cloudinary_1.cloudinary.uploader.destroy(deletedTask.filename);
            }
            res.status(204).send();
        }
        else {
            next((0, http_errors_1.default)(403, "You're not authorised to delete this task."));
        }
    }
    catch (error) {
        next(error);
    }
}));
//change status of a task after dragging
taskRouter.put('/:taskId/drag', JWTAuth_1.default, (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    var _j, _k;
    try {
        const isUserProjectLeader = yield schema_2.default.findOne({ $and: [{ _id: req.params.projectId }, { leader: (_j = req.payload) === null || _j === void 0 ? void 0 : _j._id }] });
        const isUserTaskMusician = yield schema_3.default.findOne({ $and: [{ _id: req.params.taskId }, { musicians: (_k = req.payload) === null || _k === void 0 ? void 0 : _k._id }] });
        if (isUserProjectLeader || isUserTaskMusician) {
            const taskWithNewStatus = yield schema_3.default.findByIdAndUpdate(req.params.taskId, { status: req.body.status });
            if (!taskWithNewStatus)
                return next((0, http_errors_1.default)(404, `Task with id ${req.params.taskId} was not found.`));
            res.send(taskWithNewStatus);
        }
        else {
            next((0, http_errors_1.default)(403, "You're not authorised to edit this task."));
        }
    }
    catch (error) {
        next(error);
    }
}));
//add note to task
taskRouter.post('/:taskId/notes', JWTAuth_1.default, (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    var _l, _m;
    try {
        const sender = yield schema_1.default.findById((_l = req.payload) === null || _l === void 0 ? void 0 : _l._id);
        if (!sender)
            return next((0, http_errors_1.default)(404, `User with id ${(_m = req.payload) === null || _m === void 0 ? void 0 : _m._id} could not be found.`));
        const newNote = { sender, text: req.body.text };
        const taskWithNote = yield schema_3.default.findByIdAndUpdate(req.params.taskId, { $push: { notes: newNote } }, { new: true });
        if (!taskWithNote)
            return next((0, http_errors_1.default)(404, `Task with id ${req.params.taskId} was not found.`));
        res.send(taskWithNote);
    }
    catch (error) {
        next(error);
    }
}));
taskRouter.put('/:taskId/notes/:noteId', JWTAuth_1.default, (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    var _o, _p;
    try {
        const task = yield schema_3.default.findById(req.params.taskId);
        if (!task)
            return next((0, http_errors_1.default)(404, `Task with id ${req.params.taskId} was not found.`));
        const noteIndex = (_o = task.notes) === null || _o === void 0 ? void 0 : _o.findIndex(n => n._id.toString() === req.params.noteId);
        console.log(noteIndex);
        if (noteIndex && noteIndex !== -1) {
            if (task.notes[noteIndex].sender._id.toString() === ((_p = req.payload) === null || _p === void 0 ? void 0 : _p._id)) {
                task.notes[noteIndex] = Object.assign(Object.assign({}, task.notes[noteIndex].toObject()), req.body);
                yield task.save();
                res.send(task);
            }
            else {
                next((0, http_errors_1.default)(403, "You cannot edit somebody else's note."));
            }
        }
        else {
            next((0, http_errors_1.default)(404, `Note cannot be found.`));
        }
    }
    catch (error) {
        next(error);
    }
}));
taskRouter.delete('/:taskId/notes/:noteId', JWTAuth_1.default, (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    var _q;
    try {
        const task = yield schema_3.default.findById(req.params.taskId);
        if (!task)
            return next((0, http_errors_1.default)(404, `Task with id ${req.params.taskId} was not found.`));
        const noteIndex = (_q = task.notes) === null || _q === void 0 ? void 0 : _q.findIndex(n => n._id.toString() === req.params.noteId);
        console.log(noteIndex);
        if (noteIndex && noteIndex !== -1) {
            const taskWithoutNote = yield schema_3.default.findByIdAndUpdate(req.params.taskId, { $pull: { notes: { _id: req.params.noteId } } }, { new: true });
            taskWithoutNote ? res.send(taskWithoutNote) : next((0, http_errors_1.default)(404, `Task with id ${req.params.taskId} was not found.`));
        }
        else {
            next((0, http_errors_1.default)(403, "You cannot delete somebody else's note."));
        }
    }
    catch (error) {
        next(error);
    }
}));
exports.default = taskRouter;
