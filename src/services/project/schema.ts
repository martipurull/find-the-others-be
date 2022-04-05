import mongoose from 'mongoose'
import { IProject } from '../../types'

const { Schema, model } = mongoose

const ProjectModel = new Schema<IProject>({
    title: { type: String, required: true },
    projectAdmins: [{ type: Schema.Types.ObjectId, ref: 'User' }],
    members: [{ type: Schema.Types.ObjectId, ref: 'User' }],
    description: { type: String, required: true },
    projectImage: { type: String },
    filename: { type: String },
    dueDate: Date,
    trackToDate: {
        audiofile: String,
        filename: String
    },
    trackCover: {
        image: String,
        filename: String
    },
    trackName: String,
    bands: [{ type: Schema.Types.ObjectId, ref: 'Band', required: true }],
    projectPosts: [{ type: Schema.Types.ObjectId, ref: 'Post' }],
    tasks: [{ type: Schema.Types.ObjectId, ref: 'Task' }],
    isActive: { type: Boolean, required: true, default: true }
}, { timestamps: true })

export default model('Project', ProjectModel)