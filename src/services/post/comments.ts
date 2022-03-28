import { Router, Request, Response, NextFunction } from 'express'
import createHttpError from 'http-errors'
import JWTAuth from '../../middleware/JWTAuth'
import UserModel from '../user/schema'
import PostModel from '../post/schema'
import { Types } from 'mongoose'

const commentsRouter = Router({ mergeParams: true })

commentsRouter.post('/', JWTAuth, async (req: Request, res: Response, next: NextFunction) => {
    try {
        const commenter = await UserModel.findById(req.payload?._id)
        if (!commenter) return next(createHttpError(404, `User with id ${req.payload?._id} could not be found.`))
        const { postId } = req.body
        const comment = { sender: commenter._id, text: req.body.text }
        const postWithComment = await PostModel.findByIdAndUpdate(postId, { $push: { comments: comment } }, { new: true })
        if (!postWithComment) return next(createHttpError(404, `Post with id ${postId} does not exist.`))
        res.send(postWithComment)
    } catch (error) {
        next(error)
    }
})

commentsRouter.get('/', JWTAuth, async (req: Request, res: Response, next: NextFunction) => {
    try {
        const post = await PostModel.findById(req.params.postId)
        if (!post) return next(createHttpError(404, `Post with id ${req.params.postId} does not exist.`))
        res.send(post.comments)
    } catch (error) {
        next(error)
    }
})

commentsRouter.put('/:commentId', JWTAuth, async (req: Request, res: Response, next: NextFunction) => {
    try {
        const post = await PostModel.findById(req.params.postId)
        if (post) {
            const commentIndex = post.comments?.findIndex(c => c._id.toString() === req.params.commentId)
            if (commentIndex && commentIndex !== -1) {
                post.comments![commentIndex] = { ...post.comments![commentIndex].toObject(), ...req.body }
                await post.save()
                res.send(post)
            } else {
                next(createHttpError(404, `Comment cannot be found.`))
            }
        } else {
            next(createHttpError(404, `Post with id ${req.params.postId} does not exist.`))
        }
    } catch (error) {
        next(error)
    }
})

commentsRouter.delete('/:commentId', JWTAuth, async (req: Request, res: Response, next: NextFunction) => {
    try {
        const post = await PostModel.findByIdAndUpdate(req.params.postId, { $pull: { comments: { _id: req.params.commentId } } }, { new: true })
        post ? res.send(post) : next(createHttpError(404, `Post with id ${req.params.postId} does not exist.`))
    } catch (error) {
        next(error)
    }
})

//like and unlike comments

commentsRouter.post('/likeComment', JWTAuth, async (req: Request, res: Response, next: NextFunction) => {
    try {
        const user = await UserModel.findById(req.payload!._id) as Types.ObjectId
        if (!user) return next(createHttpError(404, `No user logged in`))
        const { postId } = req.body
        const { commentId } = req.body
        const post = await PostModel.findById(postId)
        if (!post) return next(createHttpError(404, `Post with id ${postId} does not exist.`))
        if (post.comments && post.comments.length > 0) {
            const commentIndex = post.comments.findIndex(c => c._id.toString() === commentId)
            if (commentIndex !== -1) {
                let userLikesComment = false
                post.comments[commentIndex].likes.forEach(likerId => likerId.toString() === user._id.toString() ? userLikesComment = true : userLikesComment = false)
                if (userLikesComment) {
                    const remainingLikes = post.comments[commentIndex].likes.filter(liker => liker._id.toString() !== user._id.toString())
                    post.comments[commentIndex].likes = remainingLikes
                    post.save()
                    res.send({ message: "You no longer like this comment.", comment: post.comments[commentIndex] })
                } else {
                    post.comments[commentIndex].likes.push(user._id)
                    post.save()
                    res.send({ message: 'You like this comment.', comment: post.comments[commentIndex] })
                }
            } else {
                next(createHttpError(404, `Comment with id ${commentId} does not exist.`))
            }
        } else {
            next(createHttpError(404, `Post with id ${postId} has no comments.`))
        }
    } catch (error) {
        next(error)
    }
})

export default commentsRouter