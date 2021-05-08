import path from 'path'
import App from './App'

if (process.argv.length < 3) {
    console.log('Missing configuration file.')
    console.log('Usage: node-webhook <configFilePath>')

    process.exit(1)
}

let appConfig

try {
    const appConfigPath = path.join(process.cwd(), process.argv[2])
    appConfig = require(appConfigPath)
} catch {
    console.error('Error while opening configuration file.')
    process.exit(1)
}

const app = new App(appConfig)

app.express.listen(3000, () => {
    console.log('Listening at port 3000')
})
