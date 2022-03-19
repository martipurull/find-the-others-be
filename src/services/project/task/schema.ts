import mongoose from 'mongoose'
import { ITask } from '../../../types'

const { Schema, model } = mongoose

const NoteSchema = new Schema({
    sender: { type: Schema.Types.ObjectId, ref: 'User' },
    text: String
}, { timestamps: true })

const TaskModel = new Schema<ITask>({
    status: { type: String, required: true, enum: ['todo', 'doing', 'done'], default: 'todo' },
    musicians: [{ type: Schema.Types.ObjectId, ref: 'User' }],
    title: { type: String, required: true },
    description: { type: String, required: true },
    audioFile: String,
    filename: String,
    notes: { type: [NoteSchema], default: [] }
})


export default model('Task', TaskModel)