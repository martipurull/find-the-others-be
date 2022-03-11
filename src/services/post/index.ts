import { Router, Request, Response, NextFunction } from 'express'
import JWTAuth from '../../middleware/JWTAuth'
import createHttpError from 'http-errors'
import { cloudinary, parser } from '../utils/cloudinary'
import q2m from 'query-to-mongo'
import UserModel from '../user/schema'
import PostModel from './schema'
import BandModel from '../band/schema'
import ProjectModel from '../project/schema'

const postRouter = Router()

postRouter.post('/', JWTAuth, parser.single('postImage'), async (req: Request, res: Response, next: NextFunction) => {
    try {
        const sender = await UserModel.findById(req.payload?._id)
        if (!sender) return next(createHttpError(404, `User with id ${req.payload?._id} could not be found.`))
        const newPost = await new PostModel({ sender, image: req.file?.path || '', filename: req.file?.filename || '', ...req.body }).save()
        res.status(201).send(newPost)
    } catch (error) {
        next(error)
    }
})

postRouter.get('/', JWTAuth, async (req: Request, res: Response, next: NextFunction) => {
    try {
        const loggedInUser = await UserModel.findById(req.payload?._id)
        if (!loggedInUser) return next(createHttpError(404, `User with id ${req.payload?._id} could not be found.`))
        const followedBands = await BandModel.find({ _id: { $in: loggedInUser.followedBands } }).populate('members')
        const followedBandsMembers = followedBands.map(band => band.members)
        const followedProjects = await ProjectModel.find({ _id: { $in: loggedInUser.projects } })
        const followedProjectsMembers = followedProjects.map(project => project.members)
        const postsForUser = await PostModel.find({
            $or: [
                { sender: { $in: loggedInUser.connections } },
                { sender: { $in: followedBandsMembers } },
                { sender: { $in: followedProjectsMembers } }
            ]
        })
            .sort({ createdAt: -1 })
            .populate('sender', ['firstName', 'lastName', 'avatar', 'memberOf'])
        res.send(postsForUser)
    } catch (error) {
        next(error)
    }
})




export default postRouter