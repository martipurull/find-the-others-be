import { Router, Request, Response, NextFunction } from 'express'
import JWTAuth from '../../middleware/JWTAuth'
import createHttpError from 'http-errors'
import UserModel from '../user/schema'
import GigModel from './schema'
import applicationsRouter from './applications'

const gigRouter = Router({ mergeParams: true })

gigRouter.post('/', JWTAuth, async (req: Request, res: Response, next: NextFunction) => {
    try {
        const postingUser = await UserModel.findById(req.payload?._id)
        if (!postingUser) return next(createHttpError(404, `User with id ${req.payload?._id} was not found`))
        const newGig = await new GigModel({ postedBy: postingUser._id, ...req.body }).save()
        if (!newGig) return next(createHttpError(400, `Invalid request.`))
        const populatedNewGig = await GigModel.findById(newGig._id).populate('postedBy', ['firstName', 'lastName'])
        res.status(201).send(populatedNewGig)
    } catch (error) {
        next(error)
    }
})

gigRouter.get('/', JWTAuth, async (req: Request, res: Response, next: NextFunction) => {
    try {
        const gigs = await GigModel.find().populate('project', ['title', '_id']).populate('bands', ['name', '_id'])
        res.send(gigs)
    } catch (error) {
        next(error)
    }
})

//get all gigs posted by logged-in user
gigRouter.get('/my-gigs', JWTAuth, async (req: Request, res: Response, next: NextFunction) => {
    try {
        const gigs = await GigModel.find({ postedBy: req.payload?._id }).populate('project', ['title', '_id']).populate('bands', ['name', '_id'])
        res.send(gigs)
    } catch (error) {
        next(error)
    }
})


gigRouter.get('/:gigId', JWTAuth, async (req: Request, res: Response, next: NextFunction) => {
    try {
        const gig = await GigModel.findById(req.params.gigId)
            .populate('project', ['title', '_id'])
            .populate('bands', ['name', '_id'])
            .populate('postedBy', ['firstName', 'lastName', '_id'])
            .populate({ path: 'applications', populate: { path: 'applicant', select: ['firstName', 'lastName'] } })
        if (!gig) return next(createHttpError(404, `Gig with id ${req.params.gigId} could not be found`))
        res.send(gig)
    } catch (error) {
        next(error)
    }
})

gigRouter.put('/:gigId', JWTAuth, async (req: Request, res: Response, next: NextFunction) => {
    try {
        const editedGig = await GigModel.findByIdAndUpdate(req.params.gigId, req.body, { new: true })
        if (!editedGig) return next(createHttpError(404, `Gig with id ${req.params.gigId} could not be found.`))
        res.send(editedGig)
    } catch (error) {
        next(error)
    }
})

gigRouter.delete('/:gigId', JWTAuth, async (req: Request, res: Response, next: NextFunction) => {
    try {
        const deletedGig = await GigModel.findByIdAndDelete(req.params.gigId)
        if (!deletedGig) return next(createHttpError(404, `Gig with id ${req.params.gigId} could not be found or has already been deleted.`))
        res.status(204).send()
    } catch (error) {
        next(error)
    }
})

gigRouter.use('/:gigId/applications', applicationsRouter)


export default gigRouter