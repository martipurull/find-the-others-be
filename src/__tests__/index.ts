import dotenv from 'dotenv'
dotenv.config()

import supertest from 'supertest'
import server from '../server'
import mongoose from 'mongoose'

const request = supertest(server)

describe('Jest testings', () => {
    it('should work... it is a simple test', () => {
        expect(true).toBe(true)
    })
})

describe('Tests user access routes', () => {
    beforeAll(done => {
        const { MONGO_TEST } = process.env
        if (!MONGO_TEST) throw new Error('No Mongo url provided.')
        mongoose.connect(MONGO_TEST).then(() => {
            console.log('Connected to Mongo TEST DB.')
            done()
        })
    })
    afterAll(done => {
        mongoose.connection.dropDatabase()
            .then(() => {
                return mongoose.connection.close()
            })
            .then(() => { done() })
    })

    const validRequest = {
        firstName: 'marti',
        lastName: 'purull',
        email: 'marti@martipurull.com',
        password: '123456!Monkey',
        username: 'martipurull'
    }
    const invalidRequest = {
        email: 'marti@martipurull.com',
        password: '123456!Monkey',
        username: 'martipurull'
    }

    const validCredentials = {
        email: 'marti@martipurull.com',
        password: '123456!Monkey'
    }
    const invalidCredentials = {
        email: 'marti@martipurull.com',
        password: '123456!Penguin'
    }

    let userId: string
    let token: string

    test('that POST /register returns a 201 status code with a valid request', async () => {
        const response = await request.post('/user/access/register').send(validRequest)
        expect(response.status).toBe(201)
        expect(response.body._id).toBeDefined()
        userId = response.body._id
    })

    // test('that POST /login returns a valid token in cookies with valid credentials', async () => {
    //     const response = await request.post('/user/access/login').send(validCredentials)
    //     const cookie = response.header['accessToken']
    //     expect(response.status).toBe(200)
    //     expect(cookie).toBeDefined()
    // })

    // test('that GET /:userId returns the right user', async () => {
    //     const response = await request.get(`/user/${userId}`)
    //     expect(response.body.firstName).toBe('marti')
    // })
})