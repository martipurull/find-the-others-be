import mongoose from 'mongoose'
import { IBand, IReleasedTrack } from '../../types'

const { Schema, model } = mongoose

const ReleasedTrack = new Schema<IReleasedTrack>({
    track: String,
    filename: String
})

const BandModel = new Schema<IBand>({
    name: { type: String, required: true },
    members: [{ types: Schema.Types.ObjectId, ref: 'User' }],
    releasedTracks: [ReleasedTrack],
    projects: [{ type: Schema.Types.ObjectId, ref: 'Project' }],
    blurb: { type: String, required: true },
    bio: { type: String, required: true },
    avatar: String,
    filename: String
})

export default model('Band', BandModel)