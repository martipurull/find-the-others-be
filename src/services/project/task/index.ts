import { Router, Request, Response, NextFunction } from 'express'
import createHttpError from 'http-errors'
import JWTAuth from '../../../middleware/JWTAuth'
import { cloudinary, parser } from '../../utils/cloudinary'
import UserModel from '../../user/schema'
import ProjectModel from '../schema'
import TaskModel from '../task/schema'
import mongoose from 'mongoose'

const taskRouter = Router({ mergeParams: true })

taskRouter.post('/', JWTAuth, parser.single('audioFile'), async (req: Request, res: Response, next: NextFunction) => {
    try {
        let musicianObjectIds = []
        if (req.body.musicians) musicianObjectIds = JSON.parse(req.body.musicians).map((musicianId: string) => new mongoose.Types.ObjectId(musicianId))
        const newTask = new TaskModel({
            ...req.body,
            musicians: [...musicianObjectIds, req.payload?._id],
            audioFile: req.file?.path || '',
            filename: req.file?.filename || ''
        })
        const projectWithNewTask = await ProjectModel.findByIdAndUpdate(req.params.projectId, { $push: { tasks: newTask._id } }, { new: true })
        if (!projectWithNewTask) return next(createHttpError(404, `Project with id ${req.params.projectId} was not found.`))
        newTask.save()
        res.status(201).send(projectWithNewTask)
    } catch (error) {
        next(error)
    }
})

taskRouter.get('/', JWTAuth, async (req: Request, res: Response, next: NextFunction) => {
    try {
        const project = await ProjectModel.findById(req.params.projectId)
            .populate({ path: 'tasks', populate: [{ path: 'musicians', select: ['firstName', 'lastName', 'avatar'] }, { path: 'notes', populate: { path: 'sender', select: ['firstName', 'lastName', 'avatar'] } }] })
            .populate('members', ['firstName', 'lastName', 'avatar'])
        if (!project) return next(createHttpError(404, `Project with id ${req.params.projectId} cannot be found.`))
        res.send(project.tasks)
    } catch (error) {
        next(error)
    }
})

taskRouter.get('/:taskId', JWTAuth, async (req: Request, res: Response, next: NextFunction) => {
    try {
        const task = await TaskModel.findById(req.params.taskId)
        if (!task) return next(createHttpError(404, `Task with id ${req.params.taskId} was not found.`))
        res.send(task)
    } catch (error) {
        next(error)
    }
})

taskRouter.put('/:taskId', JWTAuth, parser.single('audioFile'), async (req: Request, res: Response, next: NextFunction) => {
    try {
        const isUserProjectLeader = await ProjectModel.findOne({ $and: [{ _id: req.params.projectId }, { leader: req.payload?._id }] })
        const isUserTaskMusician = await TaskModel.findOne({ $and: [{ _id: req.params.taskId }, { musicians: req.payload?._id }] })
        if (isUserProjectLeader || isUserTaskMusician) {
            const oldTask = await TaskModel.findById(req.params.taskId)
            if (!oldTask) return next(createHttpError(404, `Task with id ${req.params.taskId} was not found.`))
            let musicianObjectIds = []
            if (req.body.musicians) musicianObjectIds = JSON.parse(req.body.musicians).map((musicianId: string) => new mongoose.Types.ObjectId(musicianId))
            const body = { ...req.body, musicians: musicianObjectIds, audioFile: req.file?.path || oldTask.audioFile, filename: req.file?.filename || oldTask.filename }
            const editedTask = await TaskModel.findByIdAndUpdate(req.params.taskId, body, { new: true })
            if (!editedTask) return next(createHttpError(404, `Task with id ${req.params.taskId} cannot be found.`))
            if (oldTask.filename && req.file) {
                await cloudinary.uploader.destroy(oldTask.filename)
            }
            res.send(editedTask)
        } else {
            next(createHttpError(403, "You're not authorised to edit this task."))
        }
    } catch (error) {
        next(error)
    }
})

taskRouter.delete('/:taskId', JWTAuth, async (req: Request, res: Response, next: NextFunction) => {
    try {
        const isUserProjectLeader = await ProjectModel.findOne({ $and: [{ _id: req.params.projectId }, { leader: req.payload?._id }] })
        const isUserTaskMusician = await TaskModel.findOne({ $and: [{ _id: req.params.taskId }, { musicians: req.payload?._id }] })
        if (isUserProjectLeader || isUserTaskMusician) {
            const deletedTask = await TaskModel.findByIdAndDelete(req.params.taskId)
            if (!deletedTask) return next(createHttpError(404, `Task with id ${req} was not found.`))
            if (deletedTask.filename) {
                await cloudinary.uploader.destroy(deletedTask.filename)
            }
            res.status(204).send()
        } else {
            next(createHttpError(403, "You're not authorised to delete this task."))
        }
    } catch (error) {
        next(error)
    }
})

//change status of a task after dragging
taskRouter.put('/:taskId/drag', JWTAuth, async (req: Request, res: Response, next: NextFunction) => {
    try {
        const isUserProjectLeader = await ProjectModel.findOne({ $and: [{ _id: req.params.projectId }, { leader: req.payload?._id }] })
        const isUserTaskMusician = await TaskModel.findOne({ $and: [{ _id: req.params.taskId }, { musicians: req.payload?._id }] })
        if (isUserProjectLeader || isUserTaskMusician) {
            const taskWithNewStatus = await TaskModel.findByIdAndUpdate(req.params.taskId, { status: req.body.status })
            if (!taskWithNewStatus) return next(createHttpError(404, `Task with id ${req.params.taskId} was not found.`))
            res.send(taskWithNewStatus)
        } else {
            next(createHttpError(403, "You're not authorised to edit this task."))
        }
    } catch (error) {
        next(error)
    }
})

//add note to task

taskRouter.post('/:taskId/notes', JWTAuth, async (req: Request, res: Response, next: NextFunction) => {
    try {
        const sender = await UserModel.findById(req.payload?._id)
        if (!sender) return next(createHttpError(404, `User with id ${req.payload?._id} could not be found.`))
        const newNote = { sender, text: req.body.text }
        const taskWithNote = await TaskModel.findByIdAndUpdate(req.params.taskId, { $push: { notes: newNote } }, { new: true })
        if (!taskWithNote) return next(createHttpError(404, `Task with id ${req.params.taskId} was not found.`))
        res.send(taskWithNote)
    } catch (error) {
        next(error)
    }
})

taskRouter.put('/:taskId/notes/:noteId', JWTAuth, async (req: Request, res: Response, next: NextFunction) => {
    try {
        const task = await TaskModel.findById(req.params.taskId)
        if (!task) return next(createHttpError(404, `Task with id ${req.params.taskId} was not found.`))
        const noteIndex = task.notes?.findIndex(n => n._id.toString() === req.params.noteId)
        console.log(noteIndex)
        if (noteIndex && noteIndex !== -1) {
            if (task.notes![noteIndex].sender._id.toString() === req.payload?._id) {
                task.notes![noteIndex] = { ...task.notes![noteIndex].toObject(), ...req.body }
                await task.save()
                res.send(task)
            } else {
                next(createHttpError(403, "You cannot edit somebody else's note."))
            }
        } else {
            next(createHttpError(404, `Note cannot be found.`))
        }
    } catch (error) {
        next(error)
    }
})

taskRouter.delete('/:taskId/notes/:noteId', JWTAuth, async (req: Request, res: Response, next: NextFunction) => {
    try {
        const task = await TaskModel.findById(req.params.taskId)
        if (!task) return next(createHttpError(404, `Task with id ${req.params.taskId} was not found.`))
        const noteIndex = task.notes?.findIndex(n => n._id.toString() === req.params.noteId)
        console.log(noteIndex)
        if (noteIndex && noteIndex !== -1) {
            const taskWithoutNote = await TaskModel.findByIdAndUpdate(req.params.taskId, { $pull: { notes: { _id: req.params.noteId } } }, { new: true })
            taskWithoutNote ? res.send(taskWithoutNote) : next(createHttpError(404, `Task with id ${req.params.taskId} was not found.`))
        } else {
            next(createHttpError(403, "You cannot delete somebody else's note."))
        }
    } catch (error) {
        next(error)
    }
})

export default taskRouter