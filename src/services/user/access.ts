import { Router, Request, Response, NextFunction } from 'express'
import UserModel from './schema'
import { provideTokens } from '../../auth/functions'
import { parser } from '../utils/cloudinary'
import passport from 'passport'
import { verifyJWTAndRegenerate } from '../../auth/functions'
import createHttpError from 'http-errors'

const accessRouter = Router()

process.env.TS_NODE_DEV && require('dotenv').config()
const { NODE_ENV, FE_URL } = process.env

accessRouter.post('/register', parser.single('userAvatar'), async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { firstName, lastName } = req.body
        const newUser = new UserModel({
            ...req.body,
            avatar: req.file?.path || `https://ui-avatars.com/api/?name=${firstName}+${lastName}`,
            filename: req.file?.filename
        })
        await newUser.save()
        const { accessJWT, refreshJWT } = await provideTokens(newUser)
        res.cookie('accessToken', accessJWT, { httpOnly: true, secure: NODE_ENV === 'production' ? true : false, sameSite: NODE_ENV === 'production' ? 'none' : undefined })
        res.cookie('refreshToken', refreshJWT, { httpOnly: true, secure: NODE_ENV === 'production' ? true : false, sameSite: NODE_ENV === 'production' ? 'none' : undefined })
        res.status(201).send(newUser)
    } catch (error) {
        next(error)
    }
})

accessRouter.post('/login', async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { email, password } = req.body
        const user = await UserModel.authenticate(email, password)
        if (user) {
            const { accessJWT, refreshJWT } = await provideTokens(user)
            res.cookie('accessToken', accessJWT, { httpOnly: true, secure: NODE_ENV === 'production' ? true : false, sameSite: NODE_ENV === 'production' ? 'none' : undefined })
            res.cookie('refreshToken', refreshJWT, { httpOnly: true, secure: NODE_ENV === 'production' ? true : false, sameSite: NODE_ENV === 'production' ? 'none' : undefined })
            res.send('Token sent.')
        } else {
            next(createHttpError(401, 'Invalid credentials.'))
        }
    } catch (error) {
        next(error)
    }
})

accessRouter.post('/refreshToken', async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { currentRefreshJWT } = req.body
        const { accessJWT, refreshJWT } = await verifyJWTAndRegenerate(currentRefreshJWT)
        res.cookie('accessToken', accessJWT, { httpOnly: true, secure: NODE_ENV === 'production' ? true : false, sameSite: NODE_ENV === 'production' ? 'none' : undefined })
        res.cookie('refreshToken', refreshJWT, { httpOnly: true, secure: NODE_ENV === 'production' ? true : false, sameSite: NODE_ENV === 'production' ? 'none' : undefined })
        res.send('Tokens sent.')
    } catch (error) {
        next(error)
    }
})

accessRouter.get('/facebookLogin', passport.authenticate('facebook', { scope: 'email' }))

accessRouter.get('/facebookRedirect', passport.authenticate('facebook', { failureRedirect: `${FE_URL}/register` }), async (req: Request, res: Response, next: NextFunction) => {
    try {
        res.cookie('accessToken', req.user.tokens.accessJWT, { httpOnly: true, secure: NODE_ENV === 'production' ? true : false, sameSite: NODE_ENV === 'production' ? 'none' : undefined })
        res.cookie('refreshToken', req.user.tokens.refreshJWT, { httpOnly: true, secure: NODE_ENV === 'production' ? true : false, sameSite: NODE_ENV === 'production' ? 'none' : undefined })
        res.cookie('facebookId', req.user.facebookId, { httpOnly: true, secure: NODE_ENV === 'production' ? true : false, sameSite: NODE_ENV === 'production' ? 'none' : undefined })
        res.redirect(FE_URL!)
    } catch (error) {
        next(error)
    }
})

accessRouter.get('/googleLogin', passport.authenticate('google', { scope: ['profile', 'email'] }))

accessRouter.get('/googleRedirect', passport.authenticate('google'), async (req: Request, res: Response, next: NextFunction) => {
    try {
        res.cookie('accessToken', req.user.tokens.accessJWT, { httpOnly: true, secure: NODE_ENV === 'production' ? true : false, sameSite: NODE_ENV === 'production' ? 'none' : undefined })
        res.cookie('refreshToken', req.user.tokens.refreshJWT, { httpOnly: true, secure: NODE_ENV === 'production' ? true : false, sameSite: NODE_ENV === 'production' ? 'none' : undefined })
        res.redirect(FE_URL!)
    } catch (error) {
        next(error)
    }
})

export default accessRouter