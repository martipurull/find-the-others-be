import mongoose from 'mongoose'
import { IProject } from '../../types'

const { Schema, model } = mongoose

const ProjectModel = new Schema<IProject>({
    title: { type: String, required: true },
    leader: { type: Schema.Types.ObjectId, ref: 'User' },
    members: [{ type: Schema.Types.ObjectId, ref: 'User' }],
    description: { type: String, required: true },
    dueDate: Date,
    trackToDate: String,
    filename: String,
    bands: [{ type: Schema.Types.ObjectId, ref: 'Band', required: true }],
    projectPosts: [{ type: Schema.Types.ObjectId, ref: 'Post' }],
    tasks: [{ type: Schema.Types.ObjectId, ref: 'Task' }]
}, { timestamps: true })

export default model('Project', ProjectModel)