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
    bands: [{ type: Schema.Types.ObjectId, ref: 'Band' }],
    projectPosts: [{ type: Schema.Types.ObjectId, ref: 'Post' }],
    tasks: [{
        status: { type: String, required: true, enum: ['todo', 'doing', 'done'] },
        musician: { type: Schema.Types.ObjectId, ref: 'User' },
        title: { type: String, required: true },
        description: { type: String, required: true },
        audioFile: String,
        filename: String,
        notes: [{
            sender: { type: Schema.Types.ObjectId, ref: 'User' },
            text: String
        }]
    }]
}, { timestamps: true })

export default model('Project', ProjectModel)