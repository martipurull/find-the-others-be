import { IJWTPayload } from "./types";

declare module 'query-to-mongo'

declare module 'express-serve-static-core' {
    interface Request {
        payload?: IJWTPayload
        user?: IReqUser
    }
}