import passport from 'passport'
import { Strategy, Profile, VerifyCallback } from 'passport-google-oauth20'
import UserModel from '../services/user/schema'
import { provideTokens } from './functions'

process.env.TS_NODE_DEV && require('dotenv').config()
const { GOOGLE_OAUTH_ID, GOOGLE_OAUTH_SECRET, FE_REMOTE_URL } = process.env

const googleStrategy = new Strategy({
    clientID: GOOGLE_OAUTH_ID!,
    clientSecret: GOOGLE_OAUTH_SECRET!,
    callbackURL: `${FE_REMOTE_URL}/user/googleRedirect`
},
    async (accessToken: string, refreshToken: string, profile: Profile, passportNext: VerifyCallback) => {
        try {
            const user = await UserModel.findOne({ googleId: profile.id })
            if (user) {
                const tokens = await provideTokens(user)
                passportNext(null, { tokens })
            } else {
                const newUser = new UserModel({
                    firstName: profile.name?.givenName,
                    lastName: profile.name?.familyName,
                    email: profile.emails![0].value,
                    googleId: profile.id,
                    avatar: profile._json.picture
                })
                await newUser.save()
                const tokens = await provideTokens(newUser)
                passportNext(null, { tokens })
            }
        } catch (error) {
            passportNext(error)
        }
    })

passport.serializeUser(function (data, passportNext) {
    passportNext(null, data)
})

export default googleStrategy