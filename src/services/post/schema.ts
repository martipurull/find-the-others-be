import mongoose from 'mongoose'
import { IComment, IPost } from '../../types'

const { Schema, model } = mongoose

const CommentSchema = new Schema<IComment>({
    sender: { type: Schema.Types.ObjectId, ref: 'User' },
    text: { type: String, required: true },
    likes: [{ type: Schema.Types.ObjectId, ref: 'User', default: [] }]
})

const PostModel = new Schema<IPost>({
    sender: { type: Schema.Types.ObjectId, ref: 'User' },
    text: { type: String, required: true },
    image: String,
    filename: String,
    postedAt: Date,
    likes: [{ type: Schema.Types.ObjectId, ref: 'User', default: [] }],
    comments: { type: [CommentSchema], default: [] }
}, { timestamps: true, toJSON: { virtuals: true } })

PostModel.virtual('noOfPostLikes').get(function (this: IPost) { return this.likes.length })
PostModel.virtual('noOfCommentLikes').get(function (this: IComment) { return this.likes.length })

export default model('Post', PostModel)
