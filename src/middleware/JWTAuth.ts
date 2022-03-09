import { NextFunction, Request, Response } from 'express'
import createHttpError from 'http-errors'
import { verifyJWT } from '../auth/functions'

const JWTAuth = async (req: Request, res: Response, next: NextFunction) => {
    if (!req.cookies.accessToken) {
        next(createHttpError(401, 'No access token provided in cookies.'))
    } else {
        try {
            const token = req.cookies.accessToken
            const payload = await verifyJWT(token)
            req.payload = { _id: payload._id, email: payload.email }
            next()
        } catch (error) {
            next(createHttpError(401, 'Invalid token provided in cookies.'))
        }
    }
}

export default JWTAuth