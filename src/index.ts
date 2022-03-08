import server from './server'
import mongoose from 'mongoose'

process.env.TS_NODE_DEV && require('dotenv').config()

const { MONGO_CONNECTION, PORT } = process.env

mongoose.connect(MONGO_CONNECTION!)

mongoose.connection.on('connected', () => {
    console.log('Connected to Mongo!')
    server.listen(PORT, () => {
        console.log(`Server listens to port ${PORT}`)
    })
})

mongoose.connection.on('error', (err) => {
    console.log('Mongoose connection error: ', err)
})