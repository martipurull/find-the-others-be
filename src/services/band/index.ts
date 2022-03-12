import { Router, Request, Response, NextFunction } from 'express'
import BandModel from './schema'
import UserModel from '../user/schema'
import ProjectModel from '../project/schema'
import JWTAuth from '../../middleware/JWTAuth'
import createHttpError from 'http-errors'

const bandRouter = Router({ mergeParams: true })

bandRouter.post('/', JWTAuth, async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { name } = req.body
        const user = await UserModel.findById(req.payload?._id)
        if (!user) return next(createHttpError(404, `No user logged in.`))
        const newBand = new BandModel({
            ...req.body,
            avatar: req.file?.path || `https://ui-avatars.com/api/?name=${name}`,
            filename: req.file?.filename,
            members: [user]
        })
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

    } catch (error) {
        next(error)
    }
})

bandRouter.put('/:bandId', JWTAuth, async (req: Request, res: Response, next: NextFunction) => {
    try {

    } catch (error) {
        next(error)
    }
})

bandRouter.delete('/bandId', JWTAuth, async (req: Request, res: Response, next: NextFunction) => {
    try {

    } catch (error) {
        next(error)
    }
})




export default bandRouter