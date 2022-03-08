import express from 'express'
import cors from 'cors'
import cookieParser from 'cookie-parser'
import passport from 'passport'
import { errorHandlers } from './middleware/errorHandler'

// use passport.use here for facebook, google and other strategies

const server = express()
const whitelist = ['http://localhost:3000']
const corsOptions = { origin: whitelist, credentials: true }

server.use(cors(corsOptions))
server.use(express.json())
server.use(cookieParser())
server.use(passport.initialize())

// routers go here



server.use(errorHandlers)


export default server