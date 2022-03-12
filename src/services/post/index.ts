import { Router, Request, Response, NextFunction } from 'express'
import JWTAuth from '../../middleware/JWTAuth'
import createHttpError from 'http-errors'
import { cloudinary, parser } from '../utils/cloudinary'
import q2m from 'query-to-mongo'
import UserModel from '../user/schema'
import PostModel from './schema'
import BandModel from '../band/schema'
import ProjectModel from '../project/schema'
import { Types } from 'mongoose'
import commentsRouter from './comments'

const postRouter = Router({ mergeParams: true })

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

postRouter.put('/:postId', JWTAuth, parser.single('postImage'), async (req: Request, res: Response, next: NextFunction) => {
    try {
        const oldPost = await PostModel.findById(req.params.postId)
        if (oldPost) {
            if (oldPost.sender.toString() !== req.payload?._id) return next(createHttpError(401, "You cannot edit someone else's post"))
            const body = { ...req.body, image: req.file?.path || oldPost.image, filename: req.file?.filename || oldPost.filename }
            const editedPost = await PostModel.findByIdAndUpdate(req.params.postId, body, { new: true })
            if (!editedPost) return next(createHttpError(404, `Post with id ${req.params.postId} does not exist.`))
            if (oldPost.filename && req.file) {
                await cloudinary.uploader.destroy(oldPost.filename)
            }
            res.send(editedPost)
        } else {
            next(createHttpError(404, `Post with id ${req.params.postId} does not exist.`))
        }
    } catch (error) {
        next(error)
    }
})

postRouter.delete('/:postId', JWTAuth, async (req: Request, res: Response, next: NextFunction) => {
    try {
        const postToDelete = await PostModel.findById(req.params.postId)
        if (postToDelete) {
            if (postToDelete.sender.toString() !== req.payload?._id) return next(createHttpError(401, "You cannot delete someone else's post"))
            const deletedPost = await PostModel.findByIdAndDelete(req.params.postId)
            if (!deletedPost) return next(createHttpError(404, `Post with id ${req.params.postId} does not exist.`))
            if (deletedPost.filename) {
                await cloudinary.uploader.destroy(deletedPost.filename)
            }
            res.status(204).send()
        } else {
            next(createHttpError(404, `Post with id ${req.params.postId} does not exist.`))
        }
    } catch (error) {
        next(error)
    }
})

//like & unlike posts

postRouter.post('/:postId/like', JWTAuth, async (req: Request, res: Response, next: NextFunction) => {
    try {
        const user = await UserModel.findById(req.payload?._id)
        if (!user) return next(createHttpError(404, `No user logged in`))
        const userLikesPost = await PostModel.findOne({ $and: [{ _id: req.params.postId }, { likes: { $in: user } }] })
        if (userLikesPost) {
            const unlikedPost = await PostModel.findByIdAndUpdate(req.params.postId, { $pull: { likes: user._id } })
            if (!unlikedPost) return next(createHttpError(404, `Post with id ${req.params.postId} does not exist.`))
            res.send("You don't like this post anymore.")
        } else {
            const likedPost = await PostModel.findByIdAndUpdate(req.params.postId, { $push: { likes: user._id } })
            if (!likedPost) return next(createHttpError(404, `Post with id ${req.params.postId} does not exist.`))
            res.send('You like this post.')
        }
    } catch (error) {
        next(error)
    }
})

//comments

postRouter.use('/:postId/comments', commentsRouter)


export default postRouter