import express, { Request, Response, NextFunction } from 'express'
import createHttpError from 'http-errors'
import { cloudinary, parser } from '../utils/cloudinary'
import UserModel from './schema'
import JWTAuth from '../../middleware/JWTAuth'
import accessRouter from './access'
import meRouter from './me'

const userRouter = express.Router()

userRouter.use('/access', accessRouter)
userRouter.use('/me', meRouter)







export default userRouter