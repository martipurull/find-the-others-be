import { Router, Request, Response, NextFunction } from 'express'
import createHttpError from 'http-errors'
import JWTAuth from '../../middleware/JWTAuth'
import UserModel from '../user/schema'
import GigModel from './schema'
import ProjectModel from '../project/schema'
import { sendGigConfirmation, sendGigRejection, sendGigRejections } from '../utils/email'
import { cloudinary, parser } from '../utils/cloudinary'

const applicationsRouter = Router({ mergeParams: true })

applicationsRouter.post('/apply', JWTAuth, parser.single('audioFile'), async (req: Request, res: Response, next: NextFunction) => {
    try {
        const submission = { audioFile: req.file?.path, filename: req.file?.filename, notes: req.body.notes }
        const application = { applicant: req.payload?._id, submission }
        const gig = await GigModel.findByIdAndUpdate(req.params.gigId, { $push: { applications: application } })
        if (!gig) return next(createHttpError(404, `Gig with id ${req.params.gigId} could not be found.`))
        const applicant = await UserModel.findByIdAndUpdate(req.payload?._id, { $push: { applications: req.params.gigId } })
        if (!applicant) return next(createHttpError(404, `User with id ${req.payload?._id} could not be found.`))
        res.send(`You have applied for gig with id ${req.params.gigId}.`)
    } catch (error) {
        next(error)
    }
})

applicationsRouter.post('/withdraw', JWTAuth, async (req: Request, res: Response, next: NextFunction) => {
    try {
        const applicant = await UserModel.findByIdAndUpdate(req.payload?._id, { $pull: { applications: req.params.gigId } })
        if (!applicant) return next(createHttpError(404, `User with id ${req.payload?._id} could not be found.`))
        const gig = await GigModel.findByIdAndUpdate(req.params.gigId, { $pull: { applications: { applicant: applicant._id } } })
        if (!gig) return next(createHttpError(404, `Gig with id ${req.params.gigId} could not be found.`))
        res.send(`You have withdrawn your application for gig with id ${req.params.gigId}.`)
    } catch (error) {
        next(error)
    }
})

applicationsRouter.post('/decline', JWTAuth, async (req: Request, res: Response, next: NextFunction) => {
    try {
        const gigToCheck = await GigModel.findById(req.params.gigId)
        if (gigToCheck?.postedBy.toString() === req.payload?._id) {
            const applicantId = req.body.applicantId
            const rejectedApplicant = await UserModel.findById(applicantId)
            if (!rejectedApplicant) return next(createHttpError(404, `User with id ${applicantId} could not be found.`))
            const decliningUser = await UserModel.findByIdAndUpdate(req.payload?._id, { $pull: { applications: req.params.gigId } })
            if (!decliningUser) return next(createHttpError(404, `User with id ${req.payload?._id} could not be found.`))
            const gig = await GigModel.findByIdAndUpdate(req.params.gigId, { $pull: { applications: { applicant: rejectedApplicant._id } } })
            if (!gig) return next(createHttpError(404, `Gig with id ${req.params.gigId} could not be found.`))
            const project = await ProjectModel.findById(gig.project._id)
            if (!project) return next(createHttpError(404, `Project with ${gig.project._id} could not found.`))
            await sendGigRejection(decliningUser, rejectedApplicant, gig, project)
            res.send(`You have turned down applicant with id ${applicantId} for gig with id ${req.params.gigId}.`)
        } else {
            next(createHttpError(403, 'You cannot decline an application for a gig you did not post.'))
        }
    } catch (error) {
        next(error)
    }
})

applicationsRouter.post('/accept', JWTAuth, async (req: Request, res: Response, next: NextFunction) => {
    try {
        const gigToCheck = await GigModel.findById(req.params.gigId)
        if (gigToCheck?.postedBy.toString() === req.payload?._id) {
            const { applicantId } = req.body
            const acceptingUser = await UserModel.findById(req.payload?._id)
            const gig = await GigModel.findByIdAndUpdate(req.params.gigId, { isGigAvailable: false })
            if (!gig) return next(createHttpError(404, `Gig with id ${req.params.gigId} could not be found.`))
            const project = await ProjectModel.findByIdAndUpdate(gig.project._id, { $push: { members: applicantId } })
            if (!project) return next(createHttpError(404, `Project with id ${gig.project._id} could not be found.`))
            const successfulApplicant = await UserModel.findByIdAndUpdate(applicantId, { $pull: { applications: req.params.gigId }, $push: { projects: project._id } })
            if (!successfulApplicant) return next(createHttpError(404, `Applicant with id ${req.payload?._id} could not be found.`))
            await sendGigConfirmation(acceptingUser!, successfulApplicant, gig, project)
            const remainingApplications = gig.applications.filter(application => application.applicant.toString() !== applicantId)
            const remainingApplicantsIds = remainingApplications.map(application => application.applicant._id.toString())
            const { contactedRejects, unableToContactRejects } = await sendGigRejections(acceptingUser!, remainingApplicantsIds, gig, project)
            res.send({ successfulApplicant, contactedRejects, unableToContactRejects })
        } else {
            next(createHttpError(403, 'You cannot accept an application for a gig you did not post.'))
        }
    } catch (error) {
        next(error)
    }
})


export default applicationsRouter