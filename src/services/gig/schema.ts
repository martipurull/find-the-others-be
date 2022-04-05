import mongoose from 'mongoose'
import { IGig } from '../../types'

const { Schema, model } = mongoose

const ApplicationSchema = new Schema({
    applicant: { type: Schema.Types.ObjectId, ref: 'User' },
    submission: {
        audioFile: String,
        filename: String,
        notes: String
    }
}, { timestamps: true })

const GigModel = new Schema<IGig>({
    title: { type: String, required: true },
    postedBy: { type: Schema.Types.ObjectId, required: true, ref: 'User' },
    project: { type: Schema.Types.ObjectId, required: true, ref: 'Project' },
    bands: [{ type: Schema.Types.ObjectId, ref: 'Band' }],
    description: { type: String, required: true },
    genre: { type: String, required: true },
    hours: { type: Number, required: true },
    instrument: { type: String, required: true, enum: ['bass', 'brass', 'drums', 'guitar', 'keys', 'mastering', 'mixing', 'percussion', 'strings', 'vocals', 'wind'] },
    otherInstrument: String,
    specifics: String,
    applications: [ApplicationSchema],
    isGigAvailable: { type: Boolean, default: true }
}, { timestamps: true, toJSON: { virtuals: true } })

GigModel.virtual('noOfApplications').get(function (this: IGig) { return this.applications.length })

export default model('Gig', GigModel)