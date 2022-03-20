import { Router, Request, Response, NextFunction } from 'express'
import createHttpError from 'http-errors'
import JWTAuth from '../../middleware/JWTAuth'
import postRouter from '../post'
import UserModel from '../user/schema'
import { cloudinary, parser } from '../utils/cloudinary'
import ProjectModel from './schema'
import BandModel from '../band/schema'
import GigModel from '../gig/schema'
import taskRouter from './task'

const projectRouter = Router({ mergeParams: true })

projectRouter.post('/', JWTAuth, async (req: Request, res: Response, next: NextFunction) => {
    try {
        const loggedInUser = await UserModel.findById(req.payload?._id)
        if (!loggedInUser) return next(createHttpError(404, `No logged in user was found.`))
        const members = [loggedInUser._id]
        const newProject = new ProjectModel({ ...req.body, leader: loggedInUser._id, members })
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
        const userProjects = await ProjectModel.find({ members: loggedInUserId }).populate('tasks', ['title', 'description'])
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
            next(createHttpError(403, 'You cannot edit a project you do not lead.'))
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
            deletedProject.members.map(async member => await UserModel.findByIdAndUpdate(member._id, { $pull: { projects: req.params.projectId } }))
            res.status(204).send()
        } else {
            next(createHttpError(403, 'You cannot delete a project you do not lead.'))
        }
    } catch (error) {
        (error)
    }
})

//get gigs for a project
projectRouter.get('/:projectId/gigs', JWTAuth, async (req: Request, res: Response, next: NextFunction) => {
    try {
        const gigsForProject = await GigModel.find({ project: req.params.projectId })
        if (!gigsForProject) return next(createHttpError(404, `Project with id ${req.params.projectId} was not found.`))
        res.send(gigsForProject)
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
                const trackToDate = { audiofile: req.file?.path, filename: req.file?.filename }
                const projectWithNewTrackToDate = await ProjectModel.findByIdAndUpdate(req.params.projectId, { trackToDate: trackToDate }, { new: true })
                if (!projectWithNewTrackToDate) return next(createHttpError(404, `Project with id ${req.params.projectId} could not be found.`))
                res.send(projectWithNewTrackToDate)
            } else {
                next(createHttpError(400, 'You did not provide a new track'))
            }
        } else {
            next(createHttpError(403, 'Only the project leader can upload a project track to date.'))
        }
    } catch (error) {
        next(error)
    }
})

projectRouter.delete('/:projectId/remove-trackToDate', JWTAuth, async (req: Request, res: Response, next: NextFunction) => {
    try {
        const isUserProjectLeader = await ProjectModel.findOne({ $and: [{ _id: req.params.projectId }, { leader: req.payload?._id }] })
        if (isUserProjectLeader) {
            const trackToDate = { audiofile: '', filename: '' }
            const projectWithoutTrackToDate = await ProjectModel.findByIdAndUpdate(req.params.projectId, { trackToDate: trackToDate }, { new: true })
            if (!projectWithoutTrackToDate) return next(createHttpError(404, `Project with id ${req.params.projectId} cannot be found.`))
            if (projectWithoutTrackToDate.trackToDate.filename) {
                await cloudinary.uploader.destroy(projectWithoutTrackToDate.trackToDate.filename)
            }
            res.send(projectWithoutTrackToDate)
        } else {
            next(createHttpError(403, 'Only the project leader can delete a project track to date.'))
        }
    } catch (error) {
        next(error)
    }
})

//add and remove trackCover

projectRouter.post('/:projectId/add-trackCover', JWTAuth, parser.single('trackCover'), async (req: Request, res: Response, next: NextFunction) => {
    try {
        const isUserProjectLeader = await ProjectModel.findOne({ $and: [{ _id: req.params.projectId }, { leader: req.payload?._id }] })
        if (isUserProjectLeader) {
            if (req.file) {
                const trackCover = { image: req.file?.path, filename: req.file?.filename }
                const projectWithNewTrackCover = await ProjectModel.findByIdAndUpdate(req.params.projectId, { trackCover: trackCover }, { new: true })
                if (!projectWithNewTrackCover) return next(createHttpError(404, `Project with id ${req.params.projectId} could not be found.`))
                res.send(projectWithNewTrackCover)
            } else {
                next(createHttpError(400, 'You did not provide a new track cover.'))
            }
        } else {
            next(createHttpError(403, 'Only the project leader can upload the track artwork.'))
        }
    } catch (error) {
        next(error)
    }
})

projectRouter.delete('/:projectId/remove-trackCover', JWTAuth, async (req: Request, res: Response, next: NextFunction) => {
    try {
        const isUserProjectLeader = await ProjectModel.findOne({ $and: [{ _id: req.params.projectId }, { leader: req.payload?._id }] })
        if (isUserProjectLeader) {
            const trackCover = { image: '', filename: '' }
            const projectWithoutTrackCover = await ProjectModel.findByIdAndUpdate(req.params.projectId, { trackCover: trackCover }, { new: true })
            if (!projectWithoutTrackCover) return next(createHttpError(404, `Project with id ${req.params.projectId} cannot be found.`))
            if (projectWithoutTrackCover.trackCover.filename) {
                await cloudinary.uploader.destroy(projectWithoutTrackCover.trackCover.filename)
            }
            res.send(projectWithoutTrackCover)
        } else {
            next(createHttpError(403, 'Only the project leader can delete a project track to date.'))
        }
    } catch (error) {
        next(error)
    }
})

//send completed track to bands for release

projectRouter.post('/:projectId/send-track-to-band', JWTAuth, async (req: Request, res: Response, next: NextFunction) => {
    try {
        const isUserProjectLeader = await ProjectModel.findOne({ $and: [{ _id: req.params.projectId }, { leader: req.payload?._id }] })
        if (isUserProjectLeader) {
            const trackToSend = {
                track: { audiofile: isUserProjectLeader.trackToDate.audiofile, filename: isUserProjectLeader.trackToDate.filename },
                cover: { image: isUserProjectLeader.trackCover.image, filename: isUserProjectLeader.trackCover.filename }
            }
            isUserProjectLeader.bands.map(async band => await BandModel.findByIdAndUpdate(band._id, { $push: { readyTracks: trackToSend } }))
            res.send({ sentTrack: trackToSend, sender: isUserProjectLeader.leader, recipients: isUserProjectLeader.bands })
        } else {
            next(createHttpError(403, 'Only the project leader can send the completed track to the project bands.'))
        }
    } catch (error) {
        next(error)
    }
})

//complete project: make inactive

projectRouter.post('/:projectId/complete-project', JWTAuth, async (req: Request, res: Response, next: NextFunction) => {
    try {
        const isUserProjectLeader = await ProjectModel.findOne({ $and: [{ _id: req.params.projectId }, { leader: req.payload?._id }] })
        if (isUserProjectLeader) {
            const completedProject = await ProjectModel.findByIdAndUpdate(req.params.projectId, { isActive: false }, { new: true })
            if (!completedProject) return next(createHttpError(404, `Project with id ${req.params.projectId} could not be found.`))
            res.send(completedProject)
        } else {
            next(createHttpError(403, 'Only the project leader can mak the project as completed.'))
        }
    } catch (error) {
        next(error)
    }
})

projectRouter.delete('/:projectId/leave', JWTAuth, async (req: Request, res: Response, next: NextFunction) => {
    try {
        const userWithoutProject = await UserModel.findByIdAndUpdate(req.payload?._id, { $pull: { projects: req.params.projectId } })
        if (!userWithoutProject) return next(createHttpError(404, `User with project id ${req.payload?._id} cannot not be found.`))
        const projectWithoutUser = await ProjectModel.findByIdAndUpdate(req.params.projectId, { $pull: { members: req.payload?._id } })
        if (!projectWithoutUser) return next(createHttpError(404, `Project with id ${req.params.projectId} cannot be found.`))
        res.send('You are no longer a member of this project.')
    } catch (error) {
        next(error)
    }
})

projectRouter.use('/:projectId/posts', postRouter)
projectRouter.use('/:projectId/tasks', taskRouter)

export default projectRouter