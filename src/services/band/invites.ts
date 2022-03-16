import { Router, Request, Response, NextFunction } from 'express'
import createHttpError from 'http-errors'
import JWTAuth from '../../middleware/JWTAuth'
import BandModel from './schema'
import UserModel from '../user/schema'
import { notifyBandMembers, notifyRemovedMember, sendBandInvite, withdrawBandInvite } from '../utils/email'

const bandInviteRouter = Router({ mergeParams: true })

bandInviteRouter.post('/send-invite', JWTAuth, async (req: Request, res: Response, next: NextFunction) => {
    try {
        const isUserBandAdmin = await BandModel.findOne({ $and: [{ _id: req.params.bandId }, { bandAdmins: req.payload?._id }] })
        if (isUserBandAdmin) {
            const loggedInUser = await UserModel.findById(req.payload?._id)
            if (!loggedInUser) return next(createHttpError(404, `No logged in user was found.`))
            const invitingBand = await BandModel.findById(req.params.bandId)
            if (!invitingBand) return next(createHttpError(404, `Band with id ${req.params.bandId} cannot be found.`))
            const { inviteeId } = req.body
            const offeringBand = await BandModel.findByIdAndUpdate(req.params.bandId, { $push: { invitationsSent: inviteeId } })
            if (!offeringBand) return next(createHttpError(404, `Band with id ${req.params.bandId} cannot be found.`))
            const offeredUser = await UserModel.findByIdAndUpdate(inviteeId, { $push: { bandOffers: req.params.bandId } })
            if (!offeredUser) return next(createHttpError(404, `User with id ${inviteeId} cannot be found.`))
            await sendBandInvite(loggedInUser, offeredUser, invitingBand)
            res.send(`You invited ${offeredUser.firstName} ${offeredUser.lastName} to join ${invitingBand.name} as a member.`)
        } else {
            next(createHttpError(403, 'You cannot invite musicians to join bands you are not an admin of.'))
        }
    } catch (error) {
        next(error)
    }
})

bandInviteRouter.post('/withdraw-invite', JWTAuth, async (req: Request, res: Response, next: NextFunction) => {
    try {
        const isUserBandAdmin = await BandModel.findOne({ $and: [{ _id: req.params.bandId }, { bandAdmins: req.payload?._id }] })
        if (isUserBandAdmin) {
            const loggedInUser = await UserModel.findById(req.payload?._id)
            if (!loggedInUser) return next(createHttpError(404, `No logged in user was found.`))
            const invitingBand = await BandModel.findById(req.params.bandId)
            if (!invitingBand) return next(createHttpError(404, `Band with id ${req.params.bandId} cannot be found.`))
            const { inviteeId } = req.body
            const offeringBand = await BandModel.findByIdAndUpdate(req.params.bandId, { $pull: { invitationsSent: inviteeId } })
            if (!offeringBand) return next(createHttpError(404, `Band with id ${req.params.bandId} cannot be found.`))
            const offeredUser = await UserModel.findByIdAndUpdate(inviteeId, { $pull: { bandOffers: req.params.bandId } })
            if (!offeredUser) return next(createHttpError(404, `User with id ${inviteeId} cannot be found.`))
            await withdrawBandInvite(loggedInUser, offeredUser, offeringBand)
            res.send(`You withdrew your invitation to ${offeredUser.firstName} ${offeredUser.lastName}. They can no longer join ${invitingBand.name}.`)
        } else {
            next(createHttpError(403, 'You cannot withdraw an invitation to join bands you are not an admin of.'))
        }
    } catch (error) {
        next(error)
    }
})

bandInviteRouter.post('/accept-invite', JWTAuth, async (req: Request, res: Response, next: NextFunction) => {
    try {
        const hasUserBeenOffered = await UserModel.findOne({ $and: [{ _id: req.payload?._id }, { bandOffers: req.params.bandId }] })
        if (hasUserBeenOffered) {
            const loggedInUser = await UserModel.findByIdAndUpdate(req.payload?._id, { $pull: { bandOffers: req.params.bandId }, $push: { memberOf: req.params.bandId } })
            if (!loggedInUser) return next(createHttpError(404, `No logged in user was found.`))
            const invitingBand = await BandModel.findByIdAndUpdate(req.params.bandId, { $pull: { invitationsSent: req.payload?._id }, $push: { members: req.payload?._id } })
            if (!invitingBand) return next(createHttpError(404, `Band with id ${req.params.bandId} cannot be found.`))
            const membersToEmail = await UserModel.find({ memberOf: req.params.bandId })
            if (!membersToEmail) return next(createHttpError(404, `No members to email were found for band with id ${req.params.bandId}.`))
            const messageToMembers = `${loggedInUser.firstName} ${loggedInUser.lastName} is now a member of ${invitingBand.name}.`
            await notifyBandMembers(loggedInUser, membersToEmail, invitingBand, messageToMembers)
            res.send(`${loggedInUser.firstName} ${loggedInUser.lastName} is now a member of ${invitingBand.name}.`)
        } else {
            next(createHttpError(403, 'You cannot accept an invitation you have not received.'))
        }
    } catch (error) {
        next(error)
    }
})

bandInviteRouter.post('/decline-invite', JWTAuth, async (req: Request, res: Response, next: NextFunction) => {
    try {
        const hasUserBeenOffered = await UserModel.findOne({ $and: [{ _id: req.payload?._id }, { bandOffers: req.params.bandId }] })
        if (hasUserBeenOffered) {
            const loggedInUser = await UserModel.findByIdAndUpdate(req.payload?._id, { $pull: { bandOffers: req.params.bandId } })
            if (!loggedInUser) return next(createHttpError(404, `No logged in user was found.`))
            const invitingBand = await BandModel.findByIdAndUpdate(req.params.bandId, { $pull: { invitationsSent: req.payload?._id } })
            if (!invitingBand) return next(createHttpError(404, `Band with id ${req.params.bandId} cannot be found.`))
            const membersToEmail = await UserModel.find({ memberOf: req.params.bandId })
            if (!membersToEmail) return next(createHttpError(404, `No members to email were found for band with id ${req.params.bandId}.`))
            const messageToMembers = `${loggedInUser.firstName} ${loggedInUser.lastName} has rejected the invitation to join ${invitingBand.name}.`
            await notifyBandMembers(loggedInUser, membersToEmail, invitingBand, messageToMembers)
            res.send(`You declined to become a member of ${invitingBand.name}`)
        } else {
            next(createHttpError(403, 'You cannot decline an invitation you have not received.'))
        }
    } catch (error) {
        next(error)
    }
})

bandInviteRouter.post('/remove-band-member', JWTAuth, async (req: Request, res: Response, next: NextFunction) => {
    try {
        const isUserBandAdmin = await BandModel.findOne({ $and: [{ _id: req.params.bandId }, { bandAdmins: req.payload?._id }] })
        if (isUserBandAdmin) {
            const loggedInUser = await UserModel.findById(req.payload?._id)
            if (!loggedInUser) return next(createHttpError(404, `No logged in user was found.`))
            const { removedMemberId } = req.body
            const bandWithoutMember = await BandModel.findByIdAndUpdate(req.params.bandId, { $pull: { members: removedMemberId } })
            if (!bandWithoutMember) return next(createHttpError(404, `Band with id ${req.params.bandId} cannot be found.`))
            const memberWithoutBand = await UserModel.findByIdAndUpdate(removedMemberId, { $pull: { memberOf: req.params.bandId } })
            if (!memberWithoutBand) return next(createHttpError(404, `User with id ${removedMemberId} cannot be found.`))
            await notifyRemovedMember(loggedInUser, memberWithoutBand, bandWithoutMember)
            res.send(`You have removed ${memberWithoutBand.firstName} ${memberWithoutBand.lastName} from your band ${bandWithoutMember.name}.`)
        } else {
            next(createHttpError(403, 'You cannot withdraw an invitation to join bands you are not an admin of.'))
        }
    } catch (error) {
        next(error)
    }
})



export default bandInviteRouter