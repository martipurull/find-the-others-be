import { Router, Request, Response, NextFunction } from 'express'
import BandModel from './schema'
import UserModel from '../user/schema'
import ProjectModel from '../project/schema'
import JWTAuth from '../../middleware/JWTAuth'
import createHttpError from 'http-errors'
import { parser, cloudinary } from '../utils/cloudinary'
import bandInviteRouter from './invites'

const bandRouter = Router({ mergeParams: true })

bandRouter.post('/', JWTAuth, parser.single('bandAvatar'), async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { name } = req.body
        const user = await UserModel.findById(req.payload?._id)
        if (!user) return next(createHttpError(404, `No user logged in.`))
        const newBand = new BandModel({
            ...req.body,
            avatar: req.file?.path || `https://ui-avatars.com/api/?name=${name}`,
            filename: req.file?.filename,
            bandAdmins: [user._id],
            members: [user._id]
        })
        await UserModel.findByIdAndUpdate(req.payload?._id, { $push: { memberOf: newBand._id } })
        await newBand.save()
        res.send(newBand)
    } catch (error) {
        next(error)
    }
})

bandRouter.get('/', JWTAuth, async (req: Request, res: Response, next: NextFunction) => {
    try {
        const bands = await BandModel.find().populate('members', ['firstName', 'lastName', '_id'])
        res.send(bands)
    } catch (error) {
        next(error)
    }
})

bandRouter.get('/:bandId', JWTAuth, async (req: Request, res: Response, next: NextFunction) => {
    try {
        const band = await BandModel.findById(req.params.bandId).populate('members', ['firstName', 'lastName']).populate('projects', 'title').populate('bandAdmins', ['firstName', 'lastName'])
        if (!band) return next(createHttpError(404, `Band with id ${req.params.bandId} cannot be found.`))
        res.send(band)
    } catch (error) {
        next(error)
    }
})

bandRouter.put('/:bandId', JWTAuth, parser.single('bandImage'), async (req: Request, res: Response, next: NextFunction) => {
    try {
        const isUserBandAdmin = await BandModel.findOne({ $and: [{ _id: req.params.bandId }, { bandAdmins: req.payload?._id }] })
        if (isUserBandAdmin) {
            const preEditBand = await BandModel.findById(req.params.bandId)
            if (!preEditBand) return next(createHttpError(404, `Band with id ${req.params.bandId} cannot be found.`))
            const body = { ...req.body, avatar: req.file?.path || preEditBand.avatar, filename: req.file?.filename || preEditBand.filename }
            const editedBand = await BandModel.findByIdAndUpdate(req.params.bandId, body, { new: true })
            if (!editedBand) return next(createHttpError(404, `Band with id ${req.params.bandId} cannot be found.`))
            if (preEditBand.filename && req.file) {
                await cloudinary.uploader.destroy(preEditBand.filename)
            }
            res.send(editedBand)
        } else {
            next(createHttpError(401, 'You cannot edit bands you are not an admin of.'))
        }
    } catch (error) {
        next(error)
    }
})

bandRouter.delete('/:bandId', JWTAuth, async (req: Request, res: Response, next: NextFunction) => {
    try {
        const isUserBandAdmin = await BandModel.findOne({ $and: [{ _id: req.params.bandId }, { bandAdmins: req.payload?._id }] })
        if (isUserBandAdmin) {
            const deletedBand = await BandModel.findByIdAndDelete(req.params.bandId)
            if (!deletedBand) return next(createHttpError(404, `Band with id ${req.params.bandId} cannot be found.`))
            if (deletedBand.filename) {
                await cloudinary.uploader.destroy(deletedBand.filename)
            }
            deletedBand.members.map(async member => await UserModel.findByIdAndUpdate(member._id, { $pull: { memberOf: req.params.bandId } }))
            res.status(204).send()
        } else {
            next(createHttpError(401, 'You cannot delete bands you are not an admin of.'))
        }
    } catch (error) {
        next(error)
    }
})

//release track

bandRouter.post('/:bandId/release-track', JWTAuth, async (req: Request, res: Response, next: NextFunction) => {
    try {
        const isUserBandAdmin = await BandModel.findOne({ $and: [{ _id: req.params.bandId }, { bandAdmins: req.payload?._id }] })
        if (isUserBandAdmin) {
            const { trackId } = req.body
            const trackToRelease = isUserBandAdmin.readyTracks.find(track => track._id.toString() === trackId)
            if (!trackToRelease) return next(createHttpError(404, `Track with id ${trackId} cannot be found.`))
            const moveTracks = await BandModel.findByIdAndUpdate(req.params.bandId, { $pull: { readyTracks: { _id: trackId } }, $push: { releasedTracks: trackToRelease } }, { new: true })
            if (!moveTracks) return next(createHttpError(404, `Band with id ${req.params.bandId} cannot be found.`))
            res.send(moveTracks)
        } else {
            next(createHttpError(401, 'You cannot release songs for bands you are not an admin of.'))
        }
    } catch (error) {
        next(error)
    }
})

//band invites
bandRouter.use('/:bandId', bandInviteRouter)





export default bandRouter