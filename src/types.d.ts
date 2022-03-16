import { Document, Model, Types } from 'mongoose'

export interface IUser extends Document {
    _id: string
    firstName: string
    lastName: string
    email: string
    password: string
    username: string
    refreshJWT: string
    facebookId: string
    googleId: string
    avatar: string
    filename: string
    memberOf: Types.ObjectId[]
    bandOffers: Types.ObjectId[]
    projects: Types.ObjectId[]
    connections: Types.ObjectId[]
    connectionsSent: Types.ObjectId[]
    connectionsReceived: Types.ObjectId[]
    applications: Types.ObjectId[]
    followedBands: Types.ObjectId[]
}

export interface IUserModel extends Model<IUser> {
    authenticate(email: string, plainPW: string): IUser | null
}

export interface IReqUser {
    tokens: {
        accessJWT: string
        refreshJWT: string
    }
    facebookId?: string
}

export interface IJWTPayload {
    _id: string
    email: string
}

export interface IInvitee {
    name: string
    email: string
}

export interface IProject extends Document {
    title: string
    leader: Types.ObjectId
    members: Types.ObjectId[]
    description: string
    dueDate: date
    trackToDate: string
    filename: string
    bands: Types.ObjectId[]
    projectPosts: Types.ObjectId[]
    tasks: Types.ObjectId[]
    isActive: boolean
}

export interface ITask extends Document {
    status: string
    musician: Types.ObjectId
    title: string
    description: string
    audioFile: string
    filename: string
    notes?: INote[]
}

export interface INote extends Document {
    sender: Types.ObjectId
    text: string
}

export interface IPost extends Document {
    sender: Types.ObjectId
    isForProject: boolean
    postProject: Types.ObjectId
    text: string
    image?: string
    filename?: string
    likes: Types.ObjectId[]
    comments?: IComment[]
}

export interface IComment extends Document {
    sender: Types.ObjectId
    text: string
    likes: Types.ObjectId[]
}

export interface IGig extends Document {
    title: string
    postedBy: Types.ObjectId
    project: Types.ObjectId
    bands: Types.ObjectId[]
    description: string
    genre: string
    hours: number
    instrument: string
    specifics: string
    applications: IApplication[]
    isGigAvailable: boolean
}

export interface IApplication extends Document {
    applicant: Types.ObjectId
    submission: {
        audioFile: string
        filename: string
        notes: string
    }
}

export interface IBand extends Document {
    name: string
    bandAdmins: Types.ObjectId[]
    members: Types.ObjectId[]
    invitationsSent: Types.ObjectId[]
    readyTracks: ITrack[]
    releasedTracks: ITrack[]
    projects: Types.ObjectId[]
    blurb: string
    bio: string
    avatar: string
    filename: string
    followedBy: Types.ObjectId[]
}

export interface ITrack extends Document {
    track: string
    filename: string
}