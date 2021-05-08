import http from 'http'
import https from 'https'

const ENCODING = 'utf-8'

export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'DELETE'

export interface ExecutionConfigRequest {
    type: 'request'
    endpoint: string
}

export interface ExecutionConfigScript {
    type: 'script'
    location: string
}

export interface HookConfig {
    name?: string
    forward?: {
        headers: string[]
    }
    allowedMethods?: HttpMethod[]
    execute: (ExecutionConfigRequest | ExecutionConfigScript)[]
}

export interface AppOptions {
    hooks: {
        [key: string]: HookConfig
    }
}

export interface AppRequest {
    text?: string
    body?: string
    rawBody?: string
}

const defaultHookConfig: HookConfig = {
    allowedMethods: ['POST'],
    execute: []
}

class Application {
    server: http.Server

    options: AppOptions

    constructor(options: AppOptions) {
        this.options = options

        this.server = http.createServer((rawRequest, rawResponse) => {
            const request: AppRequest = {}

            rawRequest.setEncoding(ENCODING)
            rawRequest.on('data', data => {
                request.rawBody = data
                request.text = data.toString()

                try {
                    request.body = JSON.parse(request.text as string)
                } catch { }
            })

            rawRequest.on('end', () => {
                handleRoute()
            })

            const handleRoute = () => {
                const hookId = rawRequest.url?.slice(1) as string
                const currentHook = this.options.hooks[hookId]
                const hookConfig = defaultHookConfig

                Object.assign(hookConfig, currentHook)

                const isAllowedMethod = currentHook.allowedMethods?.includes(rawRequest.method as HttpMethod)

                if (!currentHook || !isAllowedMethod) {
                    const { method, url } = rawRequest

                    rawResponse.statusCode = 404
                    rawResponse.write(JSON.stringify({ messsage: `Cannot ${method}:${url}` }))
                    rawResponse.end()
                }

                rawResponse.write('It works!')
                rawResponse.end()

                const sourceHeaders: { [key: string]: string } = {}

                console.log(hookId)

                for (const headerName of (hookConfig.forward?.headers || [])) {
                    const headerValue = rawRequest.headers[headerName] as string | undefined

                    if (headerValue) {
                        sourceHeaders[headerName] = headerValue
                    }
                }

                for (const task of hookConfig.execute) {
                    if (task.type === 'request') {
                        const handler = task.endpoint.startsWith('https') ? https : http

                        try {
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
                        } catch {
                            console.error(`Error while trying to connect to ${task.endpoint}`)
                        }
                    }
                }
            }
        })
    }
}

export default Application
