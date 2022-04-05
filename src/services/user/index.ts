import { Router, Request, Response, NextFunction } from 'express'
import accessRouter from './access'
import meRouter from './me'
import connectionRouter from './connections'
import JWTAuth from '../../middleware/JWTAuth'
import UserModel from './schema'
import createHttpError from 'http-errors'

const userRouter = Router()

userRouter.use('/access', accessRouter)
userRouter.use('/me', meRouter)
userRouter.use('/connect', connectionRouter)

userRouter.post('/findUsers', JWTAuth, async (req: Request, res: Response, next: NextFunction) => {
    try {
        const users = await UserModel.find({ $or: [{ email: req.body.searchTerm }, { firstName: req.body.searchTerm }, { lastName: req.body.searchTerm }, { username: req.body.searchTerm }] })
            .populate({ path: 'memberOf', select: ['name', 'avatar', 'followedBy', 'noOfFollowers'] })
        if (users.length === 0) return next(createHttpError(404, `No users found`))
        res.send(users)
    } catch (error) {
        next(error)
    }
})

userRouter.get('/find/:userId', JWTAuth, async (req: Request, res: Response, next: NextFunction) => {
    try {
        const user = await UserModel.findById(req.params.userId)
        if (!user) return next(createHttpError(404, `User with id ${req.params.userId} cannot be found`))
        res.send(user)
    } catch (error) {
        next(error)
    }
})


export default userRouter