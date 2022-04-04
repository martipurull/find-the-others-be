"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const server_1 = __importDefault(require("./server"));
const mongoose_1 = __importDefault(require("mongoose"));
process.env.TS_NODE_DEV && require('dotenv').config();
const { MONGO_CONNECTION, PORT } = process.env;
mongoose_1.default.connect(MONGO_CONNECTION);
mongoose_1.default.connection.on('connected', () => {
    console.log('Connected to Mongo!');
    server_1.default.listen(PORT, () => {
        console.log(`Server listens to port ${PORT}`);
    });
});
mongoose_1.default.connection.on('error', (err) => {
    console.log('Mongoose connection error: ', err);
});
