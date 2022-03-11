import mongoose from 'mongoose'
import { IGig } from '../../types'

const { Schema, model } = mongoose

const GigModel = new Schema<IGig>({
    title: { type: String, required: true },
    postedBy: { type: Schema.Types.ObjectId, required: true, ref: 'User' },
    project: { type: Schema.Types.ObjectId, required: true, ref: 'Project' },
    bands: [{ type: Schema.Types.ObjectId, ref: 'Band' }],
    description: { type: String, required: true },
    genre: { type: String, required: true },
    hours: { type: Number, required: true },
    instrument: { type: String, required: true, enum: ['guitar', 'bass', 'drums', 'percussion', 'strings', 'brass', 'wind', 'vocals'] },
    specifics: String,
    applications: [{
        applicant: { type: Schema.Types.ObjectId, ref: 'User' },
        submission: {
            audioFile: String,
            filename: String,
            notes: String
        }
    }]
}, { timestamps: true })

GigModel.virtual('noOfApplications').get(function (this: IGig) { return this.applications.length })

export default model('Gig', GigModel)