import { Router, Request, Response, NextFunction } from 'express'
import createHttpError from 'http-errors'
import { cloudinary, parser } from '../utils/cloudinary'
import UserModel from './schema'
import JWTAuth from '../../middleware/JWTAuth'

const meRouter = Router()

meRouter.get('/me', JWTAuth, async (req: Request, res: Response, next: NextFunction) => {
    try {
        if (req.payload) {
            const user = await UserModel.findById(req.payload._id)
                .populate('connections', ['firstName', 'lastName'])
                .populate('connectionsReceived', ['firstName', 'lastName'])
                .populate('memberOf', 'name')
                .populate('projects', 'title')
                .populate('applications', ['title', 'project', 'bands'])
            user ? res.send(user) : next(createHttpError(404, `User with id ${req.payload._id} was not be found.`))
        } else {
            next(createHttpError(400, 'Invalid request.'))
        }
    } catch (error) {
        next(error)
    }
})

meRouter.put('/me', JWTAuth, parser.single('userAvatar'), async (req: Request, res: Response, next: NextFunction) => {
    try {
        if (req.payload) {
            const oldUser = await UserModel.findById(req.payload._id)
            if (oldUser) {
                const body = { ...req.body, avatar: req.file?.path || oldUser.avatar, filename: req.file?.filename || oldUser.filename }
                const editedUser = await UserModel.findByIdAndUpdate(req.payload._id, body, { new: true })
                if (!editedUser) return next(createHttpError(404, `User with id ${req.payload._id} was not found.`))
                if (oldUser.filename && req.file) {
                    await cloudinary.uploader.destroy(oldUser.filename)
                }
                res.send(editedUser)
            } else {
                next(createHttpError(404, `User with id ${req.payload._id} was not found.`))
            }
        } else {
            next(createHttpError(400, 'Invalid request.'))
        }
    } catch (error) {
        next(error)
    }
})

meRouter.delete('/me', JWTAuth, async (req: Request, res: Response, next: NextFunction) => {
    try {
        if (req.payload) {
            const deletedUser = await UserModel.findByIdAndDelete(req.payload._id)
            if (!deletedUser) return next(createHttpError(404, `User with id ${req.payload._id} was not found.`))
            if (deletedUser.filename) {
                await cloudinary.uploader.destroy(deletedUser.filename)
            }
        } else {
            next(createHttpError(400, 'Invalid request.'))
        }
    } catch (error) {
        next(error)
    }
})

export default meRouter