import { Router, Request, Response, NextFunction } from 'express'
import createHttpError from 'http-errors'
import JWTAuth from '../../middleware/JWTAuth'
import postRouter from '../post'
import UserModel from '../user/schema'
import { cloudinary, parser } from '../utils/cloudinary'
import ProjectModel from './schema'
import taskRouter from './task'

const projectRouter = Router({ mergeParams: true })

projectRouter.post('/', JWTAuth, async (req: Request, res: Response, next: NextFunction) => {
    try {
        const loggedInUser = await UserModel.findById(req.payload?._id)
        if (!loggedInUser) return next(createHttpError(404, `No logged in user was found.`))
        const members = [loggedInUser]
        const newProject = await new ProjectModel({ ...req.body, leader: loggedInUser, members })
        newProject.save()
        await UserModel.findByIdAndUpdate(req.payload?._id, { $push: { projects: newProject._id } })
        res.status(201).send(newProject)
    } catch (error) {
        (error)
    }
})

projectRouter.get('/', JWTAuth, async (req: Request, res: Response, next: NextFunction) => {
    try {
        const loggedInUserId = req.payload?._id
        if (!loggedInUserId) return next(createHttpError(404, `No logged in user was found.`))
        const userProjects = await ProjectModel.find({ $in: { members: loggedInUserId } }).populate('tasks', ['title', 'description'])
        if (!userProjects) return next(createHttpError(404, `User with id ${loggedInUserId} has no projects.`))
        res.send(userProjects)
    } catch (error) {
        (error)
    }
})

projectRouter.get('/:projectId', JWTAuth, async (req: Request, res: Response, next: NextFunction) => {
    try {
        const project = await ProjectModel.findById(req.params.projectId).populate('tasks').populate('members', ['firstName', 'lastName'])
        if (!project) return next(createHttpError(404, `Project with id ${req.params.projectId} was not found.`))
        res.send(project)
    } catch (error) {
        (error)
    }
})

projectRouter.put('/:projectId', JWTAuth, async (req: Request, res: Response, next: NextFunction) => {
    try {
        const loggedInUserId = req.payload?._id
        if (!loggedInUserId) return next(createHttpError(404, `No logged in user was found.`))
        const project = await ProjectModel.findById(req.params.projectId)
        if (!project) return next(createHttpError(404, `Project with id ${req.params.projectId} cannot be found.`))
        if (loggedInUserId === project.leader.toString()) {
            const editedProject = await ProjectModel.findByIdAndUpdate(req.params.projectId, req.body, { new: true })
            if (!editedProject) return next(createHttpError(404, `Project with id ${req.params.projectId} cannot be found.`))
            res.send(editedProject)
        } else {
            next(createHttpError(401, 'You cannot edit a project you do not lead.'))
        }
    } catch (error) {
        (error)
    }
})

projectRouter.delete('/:projectId', JWTAuth, async (req: Request, res: Response, next: NextFunction) => {
    try {
        const loggedInUserId = req.payload?._id
        if (!loggedInUserId) return next(createHttpError(404, `No logged in user was found.`))
        const project = await ProjectModel.findById(req.params.projectId)
        if (!project) return next(createHttpError(404, `Project with id ${req.params.projectId} cannot be found.`))
        if (loggedInUserId === project.leader.toString()) {
            const deletedProject = await ProjectModel.findByIdAndDelete(req.params.projectId)
            if (!deletedProject) return next(createHttpError(404, `Project with id ${req.params.projectId} cannot be found.`))
            res.status(204).send()
        } else {
            next(createHttpError(401, 'You cannot delete a project you do not lead.'))
        }
    } catch (error) {
        (error)
    }
})

//add and remove track as trackToDate

projectRouter.post('/:projectId/add-trackToDate', JWTAuth, parser.single('audioFile'), async (req: Request, res: Response, next: NextFunction) => {
    try {
        const isUserProjectLeader = await ProjectModel.findOne({ $and: [{ _id: req.params.projectId }, { leader: req.payload?._id }] })
        if (isUserProjectLeader) {
            if (req.file) {
                const body = { trackToDate: req.file?.path, filename: req.file?.filename }
                const projectWithNewTrackToDate = await ProjectModel.findByIdAndUpdate(req.params.projectId, body, { new: true })
                if (!projectWithNewTrackToDate) return next(createHttpError(404, `Project with id ${req.params.projectId} could not be found.`))
                res.send(projectWithNewTrackToDate)
            } else {
                next(createHttpError(400, 'You did not provide a new track'))
            }
        } else {
            next(createHttpError(401, 'Only the project leader can upload a project track to date.'))
        }
    } catch (error) {
        next(error)
    }
})

projectRouter.delete('/:projectId/remove-trackToDate', JWTAuth, async (req: Request, res: Response, next: NextFunction) => {
    try {
        const isUserProjectLeader = await ProjectModel.findOne({ $and: [{ _id: req.params.projectId }, { leader: req.payload?._id }] })
        if (isUserProjectLeader) {
            const body = { trackToDate: '', filename: '' }
            const projectWithoutTrackToDate = await ProjectModel.findByIdAndUpdate(req.params.projectId, body, { new: true })
            if (!projectWithoutTrackToDate) return next(createHttpError(404, `Project with id ${req.params.projectId} cannot be found.`))
            if (projectWithoutTrackToDate.filename) {
                await cloudinary.uploader.destroy(projectWithoutTrackToDate.filename)
            }
            res.send(projectWithoutTrackToDate)
        } else {
            next(createHttpError(401, 'Only the project leader can delete a project track to date.'))
        }
    } catch (error) {
        next(error)
    }
})

projectRouter.use('/:projectId/posts', postRouter)
projectRouter.use('/:projectId/tasks', taskRouter)

export default projectRouter