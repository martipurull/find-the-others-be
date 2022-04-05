import express from 'express'
import cors, { CorsOptions } from 'cors'
import cookieParser from 'cookie-parser'
import passport from 'passport'
import { errorHandlers } from './middleware/errorHandler'
import userRouter from './services/user'
import facebookStrategy from './auth/facebookOAuth'
import googleStrategy from './auth/googleOAuth'
import gigRouter from './services/gig'
import postRouter from './services/post'
import bandRouter from './services/band'
import projectRouter from './services/project'

const server = express()
const whitelist = ['http://localhost:3000', 'https://find-the-others-fe.vercel.app']
const corsOptions = {
    origin: function (origin: any, callback: any) {
        if (whitelist.indexOf(origin) !== -1) {
            callback(null, true)
        } else {
            callback(new Error('Not allowed by CORS'))
        }
    },
    credentials: true
}

passport.use('facebook', facebookStrategy)
passport.use('google', googleStrategy)

server.use(cors(corsOptions))
server.use(express.json())
server.use(cookieParser())
server.use(passport.initialize())

// routers go here
server.use('/user', userRouter)
server.use('/gigs', gigRouter)
server.use('/posts', postRouter)
server.use('/bands', bandRouter)
server.use('/projects', projectRouter)



server.use(errorHandlers)


export default server