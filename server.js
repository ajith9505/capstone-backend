//import pakages
require('dotenv').config()
const express = require('express')
const app = express()
const path = require('path')
const { logEvents, logger } = require('./middleware/logger')
const errorHandler = require('./middleware/errorHandler')
const cookieParser = require('cookie-parser')
const cors = require('cors')
const corsOptions = require('./config/corsOptions')
const mongoose = require('mongoose')
const connectDB = require('./config/dbConn')
const PORT = process.env.PORT || 3500

//connect to DB
connectDB()

//logging the requests
app.use(logger)

//cross origin resource sharing
app.use(cors(corsOptions))

//used for parsing the json data from request
app.use(express.json())

//parse cookies from front-end
app.use(cookieParser())

//setting the public directory
app.use(express.static('public'))

//routes
app.use('/', require('./routes/root'))
app.use('/auth', require('./routes/authRoutes'))
app.use('/expense', require('./routes/expenseRoutes'))

//responce for bad requests
app.all('*', (req, res) => {
    res.status(404)

    if (req.accepts('html')) {
        res.sendFile(path.join(__dirname, 'views', '404.html'))
    }
    else if (req.accepts('json')) {
        res.json({ message: '404 Not Found' })
    }
    else {
        res.type('txt').send('404 Not Found')
    }
})

//custom error handler
app.use(errorHandler)

mongoose.connection.once('open', () => {
    console.log('MongoDB Connected')
    app.listen(PORT, () => console.log(`Server running on port ${PORT}`))
})

//logging mongoDB error
mongoose.connection.on('error', err => {
    logEvents(`${err.no}: ${err.code}\t${err.syscall}\t${err.hostname}`, 'mongoErrLog.log')
})