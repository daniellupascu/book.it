const express = require('express')
const bodyParser = require('body-parser')

let app = express()

app.use(bodyParser.json())

app.get('/', (req, res, next) => {
    res.send('Hello world!')
})

app.listen(3000, () => {
    console.log('running on port 3000')
})