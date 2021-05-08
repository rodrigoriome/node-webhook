import http from 'http'
import https from 'https'
import express from 'express'
import finalhandler from 'finalhandler'
import { hook, HookConfig, HttpMethod } from './app/hook'

export interface AppOptions {
    hooks: HookConfig[]
}

class App {
    express: express.Application

    hooks: HookConfig[]

    public constructor(options: AppOptions) {
        this.express = express()

        this.hooks = options.hooks.map(hook.init)

        this.middlewares()
        this.routes()
    }

    private middlewares() {
        this.express.use((request, response, next) => {
            let data: any

            request.setEncoding('utf-8')
            request.on('data', chunk => {
                data = chunk
            })

            request.on('end', () => {
                request.body = data
                next()
            })
        })
    }

    private routes() {
        const makeHandlerRoute = (hook: HookConfig) => {
            this.express.all('/' + hook.slug, (request, response) => {
                if (!hook.allowedMethods.includes(request.method as HttpMethod)) {
                    return finalhandler(request, response)(null)
                }

                response.send('It works!')

                const headers: { [key: string]: string } = {}

                for (const headerName of (hook.forward?.headers || [])) {
                    const headerValue = request.headers[headerName] as string | undefined

                    if (headerValue) {
                        headers[headerName] = headerValue
                    }
                }

                for (const task of hook.callbacks) {
                    if (task.type === 'request') {
                        const handler = task.endpoint.startsWith('https') ? https : http

                        try {
                            const hookRequest = handler.request(task.endpoint, hookResponse => {
                                hookResponse.setEncoding('utf-8')

                                hookResponse.on('data', data => {
                                    console.log(data)
                                })

                                hookResponse.on('error', err => {
                                    console.error(err)
                                })
                            })

                            hookRequest.method = 'POST'

                            Object.entries(headers).map(([headerName, headerValue]) => {
                                hookRequest.setHeader(headerName, headerValue)
                            })

                            if (request.body) {
                                hookRequest.write(request.body)
                            }

                            hookRequest.end()
                        } catch (err) {
                            console.error(`Error while trying to connect to ${task.endpoint}`, err)
                        }
                    }
                }
            })
        }

        this.hooks.map(makeHandlerRoute)
    }
}

export default App
