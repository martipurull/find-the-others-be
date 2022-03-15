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
        const band = await BandModel.findById(req.params.bandId).populate('members', ['firstName', 'lastName']).populate('projects', 'title').populate('followedBy', '_id')
        if (!band) return next(createHttpError(404, `Band with id ${req.params.bandId} cannot be found.`))
        res.send(band)
    } catch (error) {
        next(error)
    }
})

bandRouter.put('/:bandId', JWTAuth, parser.single('bandImage'), async (req: Request, res: Response, next: NextFunction) => {
    try {
        const preEditBand = await BandModel.findById(req.params.bandId)
        if (!preEditBand) return next(createHttpError(404, `Band with id ${req.params.bandId} cannot be found.`))
        const body = { ...req.body, avatar: req.file?.path || preEditBand.avatar, filename: req.file?.filename || preEditBand.filename }
        const editedBand = await BandModel.findByIdAndUpdate(req.params.bandId, body, { new: true })
        if (!editedBand) return next(createHttpError(404, `Band with id ${req.params.bandId} cannot be found.`))
        if (preEditBand.filename && req.file) {
            await cloudinary.uploader.destroy(preEditBand.filename)
        }
        res.send(editedBand)
    } catch (error) {
        next(error)
    }
})

bandRouter.delete('/:bandId', JWTAuth, async (req: Request, res: Response, next: NextFunction) => {
    try {
        const deletedBand = await BandModel.findByIdAndDelete(req.params.bandId)
        if (!deletedBand) return next(createHttpError(404, `Band with id ${req.params.bandId} cannot be found.`))
        if (deletedBand.filename) {
            await cloudinary.uploader.destroy(deletedBand.filename)
        }
        res.status(204).send()
    } catch (error) {
        next(error)
    }
})

//band invites
bandRouter.use('/:bandId', bandInviteRouter)





export default bandRouter