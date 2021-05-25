import fetch from 'node-fetch'
import express from 'express'
import finalhandler from 'finalhandler'
import { Options } from 'body-parser'
import { hook, HookConfig, HttpMethod } from './app/hook'

declare module 'http' {
    interface IncomingMessage {
        rawBody: string
    }
}

declare module 'express-serve-static-core' {
    interface Request {
        rawBody: string
    }
}

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
        const verify: Options['verify'] = (request, response, buffer, encoding) => {
            if (buffer && buffer.length) {
                request.rawBody = buffer.toString(encoding as BufferEncoding || 'utf-8')
            }
        }

        this.express.use(express.urlencoded({ extended: true, verify }))
        this.express.use(express.json({ verify }))
    }

    private routes() {
        const makeHandlerRoute = (hook: HookConfig) => {
            this.express.all('/' + hook.slug, async (request, response) => {
                if (!hook.allowedMethods.includes(request.method as HttpMethod)) {
                    return finalhandler(request, response)(null)
                }

                response.send({ received: true })

                const headers: { [key: string]: string } = {}

                for (const headerName of (hook.forward?.headers || [])) {
                    const lowerHeaderName = headerName.toLowerCase()
                    const headerValue = request.headers[lowerHeaderName] as string | undefined

                    if (headerValue) {
                        headers[headerName] = headerValue
                    }
                }

                for (const task of hook.callbacks) {
                    if (task.type === 'request') {
                        await fetch(task.endpoint, {
                            headers,
                            method: task.method || 'POST',
                            body: request.rawBody
                        })
                            .then(async fetchResponse => await fetchResponse.json())
                            .then(hookResponse =>  {
                                console.log(hookResponse)
                            })
                            .catch(err => {
                                console.error(`${err.code}: ${err.message}`)
                            })
                    }
                }
            })
        }

        this.hooks.map(makeHandlerRoute)
    }
}

export default App
