import { Router, Request, Response, NextFunction } from 'express'
import createHttpError from 'http-errors'
import UserModel from './schema'
import JWTAuth from '../../middleware/JWTAuth'

const connectionRouter = Router({ mergeParams: true })

connectionRouter.post('/send-connection', JWTAuth, async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { connectionId } = req.body
        const userId = req.payload?._id
        if (connectionId === userId) return next(createHttpError(400, 'You cannot connect with yourself.'))
        const connectionRecipient = await UserModel.findByIdAndUpdate(connectionId, { $push: { connectionsReceived: userId } })
        if (!connectionRecipient) return next(createHttpError(404, `User with id ${connectionId} was not found.`))
        const connectionSender = await UserModel.findByIdAndUpdate(userId, { $push: { connectionsSent: connectionId } })
        if (!connectionSender) return next(createHttpError(404, `User with id ${userId} was not found.`))
        res.send(`You have sent a connection request to user with id ${connectionId}`)
    } catch (error) {
        next(error)
    }
})

connectionRouter.post('/withdraw-connection', JWTAuth, async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { connectionId } = req.body
        const userId = req.payload?._id
        if (connectionId === userId) return next(createHttpError(400, 'You cannot withdraw a connection with yourself.'))
        const disconnectionRecipient = await UserModel.findByIdAndUpdate(connectionId, { $pull: { connectionsReceived: userId } })
        if (!disconnectionRecipient) return next(createHttpError(404, `User with id ${connectionId} was not found.`))
        const disconnectionSender = await UserModel.findByIdAndUpdate(userId, { $pull: { connectionsSent: connectionId } })
        if (!disconnectionSender) return next(createHttpError(404, `User with id ${userId} was not found.`))
        res.send(`You have withdrawn your connection request to user with id ${connectionId}`)
    } catch (error) {
        next(error)
    }
})

connectionRouter.post('/accept-connection', JWTAuth, async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { connectionId } = req.body
        const userId = req.payload?._id
        const isIdInConnectionsReceived = await UserModel.findOne({ $and: [{ _id: userId }, { connectionsReceived: connectionId }] })
        if (isIdInConnectionsReceived) {
            const acceptingUser = await UserModel.findByIdAndUpdate(userId, { $pull: { connectionsReceived: connectionId }, $push: { connections: connectionId } })
            if (!acceptingUser) return next(createHttpError(404, `The user with id ${userId} was not found.`))
            const acceptedUser = await UserModel.findByIdAndUpdate(connectionId, { $pull: { connectionsSent: userId }, $push: { connections: userId } })
            if (!acceptedUser) return next(createHttpError(404, `The user with id ${connectionId} was not found.`))
            res.send(`New connection established between user with id ${userId} and user with id ${connectionId}`)
        } else {
            next(createHttpError(403, 'You cannot accept a connection request you have not received.'))
        }
    } catch (error) {
        next(error)
    }
})

connectionRouter.post('/decline-connection', JWTAuth, async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { connectionId } = req.body
        const userId = req.payload?._id
        const isIdInConnectionsReceived = await UserModel.findOne({ $and: [{ _id: userId }, { connectionsReceived: connectionId }] })
        if (isIdInConnectionsReceived) {
            const decliningUser = await UserModel.findByIdAndUpdate(userId, { $pull: { connectionsReceived: connectionId } })
            if (!decliningUser) return next(createHttpError(404, `The user with id ${userId} cannot be found.`))
            const declinedUser = await UserModel.findByIdAndUpdate(connectionId, { $pull: { connectionsSent: userId } })
            if (!declinedUser) return next(createHttpError(404, `User with id ${connectionId} was not found.`))
            res.send(`You've declined the connection request from user with id ${connectionId}.`)
        } else {
            next(createHttpError(403, 'You cannot decline a connection request you have not received.'))
        }
    } catch (error) {
        next(error)
    }
})

connectionRouter.post('/remove-connection', JWTAuth, async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { connectionId } = req.body
        const userId = req.payload?._id
        const unconnectingUser = await UserModel.findByIdAndUpdate(userId, { $pull: { connections: connectionId } })
        if (!unconnectingUser) return next(createHttpError(404, `The user with id ${userId} cannot be found.`))
        const unconnectedUser = await UserModel.findByIdAndUpdate(connectionId, { $pull: { connections: userId } })
        if (!unconnectedUser) return next(createHttpError(404, `User with id ${connectionId} was not found.`))
        res.send(`You are no longer connected with user with id ${connectionId}.`)
    } catch (error) {
        next(error)
    }
})

export default connectionRouter