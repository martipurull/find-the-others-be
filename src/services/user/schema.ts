import mongoose from 'mongoose'
import { IUser, IUserModel } from '../../types'
import bcrypt from 'bcrypt'

const { Schema, model } = mongoose

const UserSchema = new Schema<IUser>({
    firstName: { type: String, required: true },
    lastName: { type: String, required: true },
    email: { type: String, required: true },
    password: { type: String, required: true },
    username: { type: String, required: true },
    refreshJWT: String,
    facebookId: String,
    googleId: String,
    avatar: { type: String },
    filename: { type: String },
    memberOf: [{ type: Schema.Types.ObjectId, ref: 'Band' }],
    projects: [{ type: Schema.Types.ObjectId, ref: 'Project' }],
    connections: [{ type: Schema.Types.ObjectId, ref: 'User' }],
    connectionsSent: [{ type: Schema.Types.ObjectId, ref: 'User' }],
    connectionsReceived: [{ type: Schema.Types.ObjectId, ref: 'User' }],
    applications: [{ type: Schema.Types.ObjectId, ref: 'Gig' }]
}, { timestamps: true })

UserSchema.pre('save', async function (next) {
    const newUser = this
    const plainPW = this.password
    if (newUser.isModified('password')) {
        const hashedPW = await bcrypt.hash(plainPW, 12)
        newUser.password = hashedPW
    }
    next()
})

UserSchema.methods.toJSON = function () {
    const userDocument = this
    const userObj = userDocument.toObject()
    delete userObj.password
    delete userObj.__v
    delete userObj.refreshJWT
    return userObj
}

UserSchema.statics.authenticate = async function (email, plainPW) {
    const user = await this.findOne({ email })
    if (user) {
        const pwMatch = await bcrypt.compare(plainPW, user.password)
        if (pwMatch) {
            return user
        } else {
            return null
        }
    } else {
        return null
    }
}

const UserModel = model<IUser, IUserModel>('User', UserSchema)

export default UserModel