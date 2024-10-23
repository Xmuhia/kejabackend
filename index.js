const express = require('express')
const app = express()
const cors = require('cors');
const mongoosedb = require('./mongoose');
const router = require('./Routes/Routes')
require('dotenv').config()

app.use(cors());
mongoosedb()
app.use(require('express').json())


//route control
app.use('/', router)


//Port  Running
const port = process.env.PORT || 8080
app.listen(port, ()=>{
    console.log('Connected to port: ' + port)
})

module.exports = app;