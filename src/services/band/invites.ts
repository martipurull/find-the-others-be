import { Router, Request, Response, NextFunction } from 'express'
import createHttpError from 'http-errors'
import JWTAuth from '../../middleware/JWTAuth'
import BandModel from './schema'
import UserModel from '../user/schema'
import { notifyBandMembers, sendBandInvite } from '../utils/email'

const bandInviteRouter = Router({ mergeParams: true })

bandInviteRouter.post('/send-invite', JWTAuth, async (req: Request, res: Response, next: NextFunction) => {
    try {
        const loggedInUser = await UserModel.findById(req.payload?._id)
        if (!loggedInUser) return next(createHttpError(404, `No logged in user was found.`))
        const invitingBand = await BandModel.findById(req.params.bandId)
        if (!invitingBand) return next(createHttpError(404, `Band with id ${req.params.bandId} cannot be found.`))
        const inviteeId = req.body
        const invitedUser = await UserModel.findById(inviteeId)
        if (!invitedUser) return next(createHttpError(404, `User with id ${req.params.userId} cannot be found.`))
        const isLoggedInUserInBand = await BandModel.findOne({ $and: [{ _id: req.params.bandId }, { $in: { members: req.payload?._id } }] })
        if (isLoggedInUserInBand) {
            const offeringBand = await BandModel.findByIdAndUpdate(req.params.bandId, { $push: { invitationsSent: req.params.userId } })
            if (!offeringBand) return next(createHttpError(404, `Band with id ${req.params.bandId} cannot be found.`))
            const offeredUser = await UserModel.findByIdAndUpdate(req.params.userId, { $push: { bandOffers: req.params.bandId } })
            if (!offeredUser) return next(createHttpError(404, `User with id ${req.params.userId} cannot be found.`))
            await sendBandInvite(loggedInUser, offeredUser, invitingBand)
            res.send(`You invited ${invitedUser.firstName} ${invitedUser.lastName} to join ${invitingBand.name} as a member.`)
        } else {
            next(createHttpError(401, 'You cannot invite musicians to join bands you are not a member of.'))
        }
    } catch (error) {
        next(error)
    }
})

bandInviteRouter.post('/withdraw-invite', JWTAuth, async (req: Request, res: Response, next: NextFunction) => {
    try {
        const invitingBand = await BandModel.findById(req.params.bandId)
        if (!invitingBand) return next(createHttpError(404, `Band with id ${req.params.bandId} cannot be found.`))
        const inviteeId = req.body
        const invitedUser = await UserModel.findById(inviteeId)
        if (!invitedUser) return next(createHttpError(404, `User with id ${req.params.userId} cannot be found.`))
        const isLoggedInUserInBand = await BandModel.findOne({ $and: [{ _id: req.params.bandId }, { $in: { members: req.payload?._id } }] })
        if (isLoggedInUserInBand) {
            const offeringBand = await BandModel.findByIdAndUpdate(req.params.bandId, { $pull: { invitationsSent: req.params.userId } })
            if (!offeringBand) return next(createHttpError(404, `Band with id ${req.params.bandId} cannot be found.`))
            const offeredUser = await UserModel.findByIdAndUpdate(req.params.userId, { $pull: { bandOffers: req.params.bandId } })
            if (!offeredUser) return next(createHttpError(404, `User with id ${req.params.userId} cannot be found.`))
            res.send(`You withdrew your invitation to ${invitedUser.firstName} ${invitedUser.lastName}. They can no longer join ${invitingBand.name}.`)
        } else {
            next(createHttpError(401, 'You cannot withdraw invitations to join bands you are not a member of.'))
        }
    } catch (error) {
        next(error)
    }
})

bandInviteRouter.post('/accept-invite', JWTAuth, async (req: Request, res: Response, next: NextFunction) => {
    try {
        const loggedInUser = await UserModel.findByIdAndUpdate(req.payload?._id, { $and: [{ $pull: { bandOffers: req.params.bandId } }, { $push: { memberOf: req.params.bandId } }] })
        if (!loggedInUser) return next(createHttpError(404, `No logged in user was found.`))
        const invitingBand = await BandModel.findByIdAndUpdate(req.params.bandId, { $and: [{ $pull: { invitationsSent: req.payload?._id } }, { $push: { members: req.payload?._id } }] })
        if (!invitingBand) return next(createHttpError(404, `Band with id ${req.params.bandId} cannot be found.`))
        const membersToEmail = await UserModel.find({ memberOf: req.params.bandId })
        if (!membersToEmail) return next(createHttpError(404, `No members to email were found for band with id ${req.params.bandId}.`))
        const messageToMembers = `${loggedInUser.firstName} ${loggedInUser.lastName} has accepted your invitation to join ${invitingBand.name}.`
        await notifyBandMembers(loggedInUser, membersToEmail, invitingBand, messageToMembers)
        res.send(`You are now a member of ${invitingBand.name}`)
    } catch (error) {
        next(error)
    }
})

bandInviteRouter.post('/decline-invite', JWTAuth, async (req: Request, res: Response, next: NextFunction) => {
    try {
        const loggedInUser = await UserModel.findByIdAndUpdate(req.payload?._id, { $pull: { bandOffers: req.params.bandId } })
        if (!loggedInUser) return next(createHttpError(404, `No logged in user was found.`))
        const invitingBand = await BandModel.findByIdAndUpdate(req.params.bandId, { $pull: { invitationsSent: req.payload?._id } })
        if (!invitingBand) return next(createHttpError(404, `Band with id ${req.params.bandId} cannot be found.`))
        const membersToEmail = await UserModel.find({ memberOf: req.params.bandId })
        if (!membersToEmail) return next(createHttpError(404, `No members to email were found for band with id ${req.params.bandId}.`))
        const messageToMembers = `${loggedInUser.firstName} ${loggedInUser.lastName} has rejected your invitation to join ${invitingBand.name}.`
        await notifyBandMembers(loggedInUser, membersToEmail, invitingBand, messageToMembers)
        res.send(`You declined to become a member of ${invitingBand.name}`)
    } catch (error) {
        next(error)
    }
})




export default bandInviteRouter