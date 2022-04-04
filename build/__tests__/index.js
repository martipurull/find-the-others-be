"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const supertest_1 = __importDefault(require("supertest"));
const server_1 = __importDefault(require("../server"));
const mongoose_1 = __importDefault(require("mongoose"));
const request = (0, supertest_1.default)(server_1.default);
describe('Jest testings', () => {
    it('should work... it is a simple test', () => {
        expect(true).toBe(true);
    });
});
describe('Tests user access routes', () => {
    beforeAll(done => {
        const { MONGO_TEST } = process.env;
        if (!MONGO_TEST)
            throw new Error('No Mongo url provided.');
        mongoose_1.default.connect(MONGO_TEST).then(() => {
            console.log('Connected to Mongo TEST DB.');
            done();
        });
    });
    afterAll(done => {
        mongoose_1.default.connection.dropDatabase()
            .then(() => {
            return mongoose_1.default.connection.close();
        })
            .then(() => { done(); });
    });
    const validRequest = {
        firstName: 'marti',
        lastName: 'purull',
        email: 'marti@martipurull.com',
        password: '123456!Monkey',
        username: 'martipurull'
    };
    const invalidRequest = {
        email: 'marti@martipurull.com',
        password: '123456!Monkey',
        username: 'martipurull'
    };
    const validCredentials = {
        email: 'marti@martipurull.com',
        password: '123456!Monkey'
    };
    const invalidCredentials = {
        email: 'marti@martipurull.com',
        password: '123456!Penguin'
    };
    let userId;
    let token;
    test('that POST /register returns a 201 status code with a valid request', () => __awaiter(void 0, void 0, void 0, function* () {
        const response = yield request.post('/user/access/register').send(validRequest);
        expect(response.status).toBe(201);
        expect(response.body._id).toBeDefined();
        userId = response.body._id;
    }));
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
});
