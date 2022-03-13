import { Router, Request, Response, NextFunction } from 'express'
import createHttpError from 'http-errors'
import JWTAuth from '../../middleware/JWTAuth'
import UserModel from '../user/schema'
import ProjectModel from './schema'

const taskRouter = Router()







export default taskRouter