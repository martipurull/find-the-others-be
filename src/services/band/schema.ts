import mongoose from 'mongoose'
import { IBand, ITrack } from '../../types'

const { Schema, model } = mongoose

const Track = new Schema<ITrack>({
    track: String,
    filename: String
})

const BandModel = new Schema<IBand>({
    name: { type: String, required: true },
    bandAdmins: [{ type: Schema.Types.ObjectId, ref: 'User' }],
    members: [{ type: Schema.Types.ObjectId, ref: 'User' }],
    invitationsSent: [{ type: Schema.Types.ObjectId, ref: 'User' }],
    readyTracks: [Track],
    releasedTracks: [Track],
    projects: [{ type: Schema.Types.ObjectId, ref: 'Project' }],
    blurb: { type: String, required: true },
    bio: { type: String, required: true },
    avatar: String,
    filename: String,
    followedBy: [{ type: Schema.Types.ObjectId, ref: 'User' }]
}, { timestamps: true, toJSON: { virtuals: true } })

BandModel.virtual('noOfFollowers').get(function (this: IBand) { return this.followedBy.length })

export default model('Band', BandModel)