import { Router } from 'express'
import accessRouter from './access'
import meRouter from './me'
import connectionRouter from './connections'

const userRouter = Router()

userRouter.use('/access', accessRouter)
userRouter.use('/me', meRouter)
userRouter.use('/connect/:connectionId', connectionRouter)




export default userRouter