import { Document, Model, Types } from 'mongoose'

export interface IUser extends Document {
    firstName: string,
    lastName: string,
    email: string,
    password: string,
    username: string,
    avatar: string,
    filename: string,
    memberOf: Types.ObjectId[],
    projects: Types.ObjectId[],
    connections: Types.ObjectId[],
    connectionsSent: Types.ObjectId[],
    connectionsReceived: Types.ObjectId[],
    applications: Types.ObjectId[],
}

export interface IProject extends Document {
    title: string,
    leader: Types.ObjectId,
    members: Types.ObjectId[],
    description: string,
    dueDate: date,
    trackToDate: string,
    filename: string,
    bands: Types.ObjectId[],
    projectPosts: [{
        sender: Types.ObjectId,
        text: string,
        image: string,
        filename: string
    }],
    tasks: [{
        status: string,
        musician: Types.ObjectId,
        title: string,
        description: string,
        audioFile: string,
        filename: string,
        notes: [{
            sender: Types.ObjectId,
            text: string,
        }]
    }]
}

export interface IPost extends Document {
    sender: Types.ObjectId,
    text: string,
    image?: string,
    filename?: string,
    postedAt: date,
    likes: Types.ObjectId[],
    comments?: IComment[]
}

export interface IComment extends Document {
    sender: Types.ObjectId,
    text: string,
    likes: Types.ObjectId[],
}

