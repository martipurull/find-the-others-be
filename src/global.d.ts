import { IJWTPayload, IReqUser } from "./types";

declare module 'express-serve-static-core' {
    interface Request {
        payload?: IJWTPayload
        user?: IReqUser
    }
}