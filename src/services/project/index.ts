import { Router, Request, Response, NextFunction } from 'express'
import createHttpError from 'http-errors'
import JWTAuth from '../../middleware/JWTAuth'
import UserModel from '../user/schema'
import projectPostRouter from './projectPosts'
import ProjectModel from './schema'
import taskRouter from './task'

const projectRouter = Router()

projectRouter.post('/', JWTAuth, async (req: Request, res: Response, next: NextFunction) => {
    try {
        const loggedInUser = await UserModel.findById(req.payload?._id)
        if (!loggedInUser) return next(createHttpError(404, `No logged in user was found.`))
        const members = [loggedInUser]
        const newProject = await new ProjectModel({ ...req.body, leader: loggedInUser, members })
        newProject.save()
        res.status(201).send(newProject)
    } catch (error) {
        (error)
    }
})

projectRouter.get('/', JWTAuth, async (req: Request, res: Response, next: NextFunction) => {
    try {
        const loggedInUserId = req.payload?._id
        if (!loggedInUserId) return next(createHttpError(404, `No logged in user was found.`))
        const userProjects = await ProjectModel.find({ $in: { members: loggedInUserId } })
        if (!userProjects) return next(createHttpError(404, `User with id ${loggedInUserId} has no projects.`))
        res.send(userProjects)
    } catch (error) {
        (error)
    }
})

projectRouter.get('/:projectId', JWTAuth, async (req: Request, res: Response, next: NextFunction) => {
    try {
        const project = await ProjectModel.findById(req.params.projectId)
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

projectRouter.use('/:projectId/posts', projectPostRouter)
projectRouter.use('/:projectId/tasks', taskRouter)

export default projectRouter