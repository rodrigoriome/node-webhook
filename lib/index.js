const json = require('../hooks.example.json')
const Application = require('./app')

const app = new Application(json)

app.init()

app.server.listen(3000)
