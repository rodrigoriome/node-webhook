export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH' | 'OPTIONS' | 'HEAD'

export interface RequestCallback {
    type: 'request'
    endpoint: string
}

export interface ScriptCallback {
    type: 'script'
    location: string
}

interface Required {
    slug: string
}

export interface HookConfig {
    name?: string
    slug: string
    forward: {
        headers: string[]
    }
    allowedMethods: HttpMethod[]
    callbacks: (RequestCallback | ScriptCallback)[]
}

export interface ForwardConfig {
    headers: string[]
}

export const hook = {
    init(hook: Partial<HookConfig> & Required): HookConfig {
        return {
            name: hook.name,
            slug: hook.slug,
            allowedMethods: hook.allowedMethods || [],
            forward: {
                headers: hook.forward?.headers || ['content-type', 'content-length'],
            },
            callbacks: hook.callbacks || [],
        }
    }
}
