import passport from 'passport'
import FacebookStrategy from 'passport-facebook'
import UserModel from '../services/user/schema'
import { provideTokens } from './functions'

process.env.TS_NODE_DEV && require('dotenv').config()
const { FACEBOOK_APP_ID, FACEBOOK_APP_SECRET, FE_REMOTE_URL } = process.env

const facebookStrategy = new FacebookStrategy.Strategy({
    clientID: FACEBOOK_APP_ID!,
    clientSecret: FACEBOOK_APP_SECRET!,
    callbackURL: `${FE_REMOTE_URL}/user/facebookRedirect`,
    profileFields: ['id', 'email', 'gender', 'link', 'locale', 'name', 'timezone', 'updated_time', 'verified']
},
    async (accessToken, refreshToken, profile, passportNext) => {
        try {
            const user = await UserModel.findOne({ facebookId: profile.id })
            if (user) {
                const tokens = await provideTokens(user)
                passportNext(null, { tokens, facebookId: user.facebookId })
            } else {
                const newUser = new UserModel({
                    username: profile.username,
                    firstName: profile.name?.givenName,
                    lastName: profile.name?.familyName,
                    email: profile._json.email,
                    facebookId: profile._json.id
                })
                await newUser.save()
                const tokens = await provideTokens(newUser)
                passportNext(null, { tokens, facebookId: newUser.facebookId })
            }
        } catch (error) {
            passportNext(error)
        }
    })

passport.serializeUser(function (data, passportNext) {
    passportNext(null, data)
})

export default facebookStrategy