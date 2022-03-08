import mongoose from 'mongoose'
import { IUser } from '../../types'

const { Schema, model } = mongoose

const UserModel = new Schema<IUser>({
    firstName: { type: String, required: true },
    lastName: { type: String, required: true },
    email: { type: String, required: true },
    password: { type: String, required: true },
    username: { type: String, required: true },
    avatar: { type: String },
    filename: { type: String },
    memberOf: [{ type: Schema.Types.ObjectId, ref: 'Band' }],
    projects: [{ type: Schema.Types.ObjectId, ref: 'Project' }],
    connections: [{ type: Schema.Types.ObjectId, ref: 'User' }],
    connectionsSent: [{ type: Schema.Types.ObjectId, ref: 'User' }],
    connectionsReceived: [{ type: Schema.Types.ObjectId, ref: 'User' }],
    applications: [{ type: Schema.Types.ObjectId, ref: 'Gig' }]
}, { timestamps: true })

export default model('User', UserModel)