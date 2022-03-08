import mongoose from 'mongoose'
import { IGig } from '../../types'

const { Schema, model } = mongoose

const GigModel = new Schema<IGig>({
    title: { type: String, required: true },
    project: { type: Schema.Types.ObjectId, required: true },
    bands: [{ type: Schema.Types.ObjectId, ref: 'Band' }],
    description: { type: String, required: true },
    hours: { type: Number, required: true },
    instrument: { type: String, required: true, enum: ['guitar', 'bass', 'drums', 'percussion', 'strings', 'brass', 'wind', 'vocals'] },
    specifics: String,
    applicants: [{ type: Schema.Types.ObjectId, ref: 'User' }]
}, { timestamps: true })

export default model('Gig', GigModel)