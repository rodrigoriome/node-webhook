const path = require('path')

console.log(process.argv)

const Application = require('./app')

if (process.argv.length < 3) {
    console.log('Missing configuration file.')
    console.log('Usage: node-webhook <configFilePath>')

    process.exit(1)
}

let appConfig

try {
    const appConfigPath = path.join(process.cwd(), process.argv[2])
    console.log(appConfigPath)
    appConfig = require(appConfigPath)
} catch {
    console.error('Error while opening configuration file.')
    process.exit(1)
}

const app = new Application(appConfig)

app.init()

app.server.listen(3000)
