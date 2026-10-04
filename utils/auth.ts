import { md5 } from 'js-md5'
import { showAlert } from '@/utils/float-alert'
import { useServerInfoStore } from '@/store/server-info'
import type { ServerInfo } from '@/store/server-info'

// encrypt the password with the random salt by md5 and store it in the server state
// it's at least safer than store the clear password due to the design pattern of subsonic
async function encrypt(nowUsingIndex: number) {
    const serverInfoStore = useServerInfoStore()
    const currentServer = serverInfoStore.serverInfo[nowUsingIndex]

    if (!currentServer) {
        throw new Error('No server selected for encryption.')
    }

    if (!currentServer.password) {
        throw new Error('The server password is empty.')
    }

    const randomData = window.crypto.getRandomValues(new Uint8Array(16))
    const salt = Array.from(randomData, (byte) => byte.toString(16).padStart(2, '0')).join('')
    const token = md5(currentServer.password + salt)

    serverInfoStore.serverInfo[nowUsingIndex] = {
        ...currentServer,
        password: '',
        token,
        salt,
    }
}

async function authAndUseAPI(apiName: string, ...args: [string, string | null][]) {
    const serverInfoStore = useServerInfoStore()
    const currentServer = serverInfoStore.serverInfo[serverInfoStore.nowUsingIndex]

    if (!currentServer) {
        throw new Error('No server is selected.')
    }

    const requestURL = new URL(apiName, currentServer.url)
    const username = currentServer.username
    const salt = currentServer.salt ?? ''
    const token = currentServer.token ?? ''

    const params: [string, string | null][] = [
        ['u', username],
        ['t', token],
        ['s', salt],
        ['v', '1.16.1'],
        ['c', 'rippleplayer'],
        ['f', 'json'],
        ...args,
    ]

    for (const [key, value] of params) {
        if (value) requestURL.searchParams.set(key, value)
    }

    if (apiName === 'stream') {
        return { data: requestURL.href }
    }

    try {
        const response = await fetch(requestURL)
        const contentType = response.headers.get('content-type') ?? ''
        const isBinaryResponse = apiName === 'getCoverArt'
            || apiName === 'download'
            || apiName === 'stream'
            || contentType.startsWith('image/')
            || contentType.startsWith('audio/')

        if (isBinaryResponse) {
            const blobData = await response.blob()
            return {
                data: URL.createObjectURL(blobData),
            }
        }

        const result = await response.json()
        if (result['subsonic-response'].status == 'failed') {
            showAlert({
                content: result['subsonic-response'].error.message,
                type: 'error',
            })

            return {
                message: 'authentication failed',
            }
        }

        if (result['subsonic-response'].status == 'ok') {
            return {
                message: 'authenticated',
                data: result['subsonic-response'],
            }
        }
    } catch (error) {
        showAlert({
            content: 'Unknown Error',
            type: 'error',
        })

        return {
            message: 'unknown error',
        }
    }
}

export {
    type ServerInfo,
    encrypt,
    authAndUseAPI,
}