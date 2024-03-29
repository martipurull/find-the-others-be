import mongoose from 'mongoose'
import { IComment, IPost } from '../../types'

const { Schema, model } = mongoose

const CommentSchema = new Schema<IComment>({
    sender: { type: Schema.Types.ObjectId, ref: 'User' },
    text: { type: String, required: true },
    likes: [{ type: Schema.Types.ObjectId, ref: 'User', default: [] }]
}, { timestamps: true, toJSON: { virtuals: true } })

const PostModel = new Schema<IPost>({
    sender: { type: Schema.Types.ObjectId, ref: 'User' },
    isForProject: { type: Boolean, default: false },
    postProject: { type: Schema.Types.ObjectId, ref: 'Project' },
    text: { type: String, required: true },
    image: String,
    filename: String,
    likes: [{ type: Schema.Types.ObjectId, ref: 'User', default: [] }],
    comments: { type: [CommentSchema], default: [] }
}, { timestamps: true, toJSON: { virtuals: true } })

PostModel.virtual('noOfPostLikes').get(function (this: IPost) { return this.likes.length })
CommentSchema.virtual('noOfCommentLikes').get(function (this: IComment) { return this.likes.length })

export default model('Post', PostModel)
