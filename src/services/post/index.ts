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
        if (req.params.projectId) {
            const project = await ProjectModel.findById(req.params.projectId)
            const newPost = await new PostModel({
                ...req.body,
                sender: sender._id,
                isForProject: true,
                postProject: project,
                image: req.file?.path || '',
                filename: req.file?.filename || ''
            }).save()
            const projectWithNewPost = await ProjectModel.findByIdAndUpdate(req.params.projectId, { $push: { projectPosts: newPost._id } }, { new: true })
                .populate({ path: 'projectPosts', select: ['text', 'image', 'likes', 'comments'], populate: { path: 'sender', select: ['firstName', 'lastName', 'avatar'] } })
            if (!projectWithNewPost) return next(createHttpError(404, `Project with id ${req.params.projectId} could not be found.`))
            res.status(201).send(projectWithNewPost)
        } else {
            const newPost = await new PostModel({ sender: sender._id, image: req.file?.path || '', filename: req.file?.filename || '', ...req.body }).save()
            res.status(201).send(newPost)
        }
    } catch (error) {
        next(error)
    }
})

postRouter.get('/', JWTAuth, async (req: Request, res: Response, next: NextFunction) => {
    try {
        const loggedInUser = await UserModel.findById(req.payload?._id)
        if (!loggedInUser) return next(createHttpError(404, `User with id ${req.payload?._id} could not be found.`))
        if (req.params.projectId) {
            const project = await ProjectModel.findById(req.params.projectId).populate({ path: 'projectPosts', options: { sort: { 'createdAt': -1 } } })
            if (!project) return next(createHttpError(404, `Project with id ${req.params.projectId} cannot be found.`))
            res.send(project.projectPosts)
        } else {
            const followedBands = await BandModel.find({ _id: { $in: loggedInUser.followedBands } }).populate('members')
            const followedBandsMembers = followedBands.map(band => band.members)
            const followedProjects = await ProjectModel.find({ _id: { $in: loggedInUser.projects } })
            const followedProjectsMembers = followedProjects.map(project => project.members)
            const posts = await PostModel.find({
                $or: [
                    { sender: { $in: loggedInUser.connections } },
                    { sender: { $in: followedBandsMembers } },
                    { sender: { $in: followedProjectsMembers } },
                    { sender: loggedInUser }
                ]
            })
                .sort({ createdAt: -1 })
                .populate('sender', ['firstName', 'lastName', 'avatar', 'memberOf'])
                .populate('comments')
            const postsForUser = posts.filter(p => p.isForProject === false)
            res.send(postsForUser)
        }
    } catch (error) {
        next(error)
    }
})

postRouter.put('/:postId', JWTAuth, parser.single('postImage'), async (req: Request, res: Response, next: NextFunction) => {
    try {
        const sender = await UserModel.findById(req.payload?._id)
        if (!sender) return next(createHttpError(404, `User with id ${req.payload?._id} could not be found.`))
        const oldPost = await PostModel.findById(req.params.postId)
        if (oldPost) {
            if (oldPost.sender.toString() !== req.payload?._id) return next(createHttpError(401, "You cannot edit someone else's post"))
            if (oldPost.filename && req.file) {
                await cloudinary.uploader.destroy(oldPost.filename)
            }
            if (req.params.projectId) {
                const project = await ProjectModel.findById(req.params.projectId)
                if (!project) return next(createHttpError(404, `Project with id ${req.params.projectId} cannot be found.`))
                const editedPost = await PostModel.findByIdAndUpdate(req.params.postId, {
                    ...req.body,
                    image: req.file?.path || oldPost.image,
                    filename: req.file?.filename || oldPost.filename
                }, { new: true })
                if (!editedPost) return next(createHttpError(404, `Post with id ${req.params.postId} does not exist.`))
                res.send(editedPost)
            } else {
                const body = { ...req.body, image: req.file?.path || oldPost.image, filename: req.file?.filename || oldPost.filename }
                const editedPost = await PostModel.findByIdAndUpdate(req.params.postId, body, { new: true })
                if (!editedPost) return next(createHttpError(404, `Post with id ${req.params.postId} does not exist.`))
                res.send(editedPost)
            }
        } else {
            next(createHttpError(404, `Post with id ${req.params.postId} does not exist.`))
        }
    }
    catch (error) {
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
            if (req.params.projectId) {
                const projectWithoutPost = await ProjectModel.findByIdAndUpdate(req.params.projectId, { $pull: { projectPosts: deletedPost._id } })
                if (!projectWithoutPost) return next(createHttpError(404, `Project with id ${req.params.projectId} cannot be found.`))
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
        const userLikesPost = await PostModel.findOne({ $and: [{ _id: req.params.postId }, { likes: user._id }] })
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