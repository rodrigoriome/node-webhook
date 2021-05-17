import fetch from 'node-fetch'
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
                            body: request.body
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
