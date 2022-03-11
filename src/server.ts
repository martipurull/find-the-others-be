import express from 'express'
import cors from 'cors'
import cookieParser from 'cookie-parser'
import passport from 'passport'
import { errorHandlers } from './middleware/errorHandler'
import userRouter from './services/user'
import facebookStrategy from './auth/facebookOAuth'
import googleStrategy from './auth/googleOAuth'
import gigRouter from './services/gig'
import postRouter from './services/post'

const server = express()
const whitelist = ['http://localhost:3000']
const corsOptions = { origin: whitelist, credentials: true }

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



server.use(errorHandlers)


export default server