"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.errorHandlers = void 0;
const errorHandlers = (err, req, res, next) => {
    console.log('THE ERROR', err);
    switch (err.name) {
        case 'ValidationError':
        case 'BadRequestError':
            return res.status(400).send(err);
        case 'UnauthorizedError':
        case 'JsonWebTokenError':
        case 'TokenExpiredError':
            return res.status(401).send(err.message);
        case 'ForbiddenError':
            return res.status(403).send(err.message);
        case 'NotFoundError':
            return res.status(404).send(err);
        default:
            console.log(err);
            return res.status(500).send('Server Error');
    }
};
exports.errorHandlers = errorHandlers;
