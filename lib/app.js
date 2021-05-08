const http = require('http')
const https = require('https')

const ENCODING = 'utf-8'

class Application {
    server
    options

    constructor(options) {
        this.options = options
    }

    init() {
        this.server = http.createServer((rawRequest, rawResponse) => {
            const request = {
                text: null,
                body: null,
                rawBody: null,
            }

            rawResponse.statusCode = 500
            rawRequest.setEncoding(ENCODING)

            rawRequest.on('data', data => {
                request.rawBody = data
                request.text = data.toString()

                try {
                    request.body = JSON.parse(request.text) || undefined
                } catch { }
            })

            rawRequest.on('end', () => {
                handleRoute()
            })

            const handleRoute = () => {
                rawResponse.write('ok')
                rawResponse.end()

                for (const [hookId, hookConfig] of Object.entries(this.options.hooks)) {
                    if (rawRequest.url === '/' + hookId) {
                        const sourceHeaders = {}

                        console.log(hookId)

                        for (const headerName of hookConfig.forward.headers) {
                            const headerValue = rawRequest.headers[headerName]

                            if (headerValue) {
                                sourceHeaders[headerName] = headerValue
                            }
                        }

                        for (const task of hookConfig.execute) {
                            if (task.type === 'request') {
                                const handler = task.endpoint.startsWith('https') ? https : http

                                const hookRequest = handler.request(task.endpoint, hookResponse => {
                                    hookResponse.setEncoding(ENCODING)

                                    hookResponse.on('data', data => {
                                        console.log(data)
                                    })

                                    hookResponse.on('error', err => {
                                        console.error(err)
                                    })
                                })

                                hookRequest.method = 'POST'

                                const headers = { ...sourceHeaders }

                                Object.entries(headers).map(([headerName, headerValue]) => {
                                    hookRequest.setHeader(headerName, headerValue)
                                })

                                if (request.body) {
                                    hookRequest.write(request.rawBody)
                                }

                                hookRequest.end()
                            }
                        }
                    }
                }
            }
        })
    }
}

module.exports = Application
