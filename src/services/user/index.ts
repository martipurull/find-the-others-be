import express, { Request, Response, NextFunction } from 'express'
import createHttpError from 'http-errors'
import { provideTokens } from '../../auth/functions'
import { cloudinary, parser } from '../utils/cloudinary'
import passport from 'passport'
import UserModel from './schema'
import { verifyJWTAndRegenerate } from '../../auth/functions'

const userRouter = express.Router()

const { NODE_ENV, FE_URL } = process.env

userRouter.post('/register', parser.single('useravatar'), async (req, res, next) => {
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

userRouter.post('/login', async (req, res, next) => {
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

userRouter.post('/refreshToken', async (req, res, next) => {
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

userRouter.get('/facebookLogin', passport.authenticate('facebook', { scope: 'email' }))

userRouter.get('/facebookRedirect', passport.authenticate('facebook', { failureRedirect: `${FE_URL}/register` }), async (req, res, next) => {
    try {
        res.cookie('accessToken', req.user.tokens.accessJWT, { httpOnly: true, secure: NODE_ENV === 'production' ? true : false, sameSite: NODE_ENV === 'production' ? 'none' : undefined })
        res.cookie('refreshToken', req.user.tokens.refreshJWT, { httpOnly: true, secure: NODE_ENV === 'production' ? true : false, sameSite: NODE_ENV === 'production' ? 'none' : undefined })
        res.cookie('facebookId', req.user.facebookId, { httpOnly: true, secure: NODE_ENV === 'production' ? true : false, sameSite: NODE_ENV === 'production' ? 'none' : undefined })
        res.redirect(FE_URL!)
    } catch (error) {
        next(error)
    }
})

userRouter.get('/googleLogin', passport.authenticate('google', { scope: ['profile', 'email'] }))

userRouter.get('/googleRedirect', passport.authenticate('google'), async (req, res, next) => {
    try {
        res.cookie('accessToken', req.user.tokens.accessJWT, { httpOnly: true, secure: NODE_ENV === 'production' ? true : false, sameSite: NODE_ENV === 'production' ? 'none' : undefined })
        res.cookie('refreshToken', req.user.tokens.refreshJWT, { httpOnly: true, secure: NODE_ENV === 'production' ? true : false, sameSite: NODE_ENV === 'production' ? 'none' : undefined })
        res.redirect(FE_URL!)
    } catch (error) {
        next(error)
    }
})




export default userRouter