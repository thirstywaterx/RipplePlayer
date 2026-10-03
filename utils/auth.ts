import { md5 } from 'js-md5'
import { showAlert } from '@/utils/float-alert'

interface ServerInfo {
    URL: URL,
    username: string,
    password: string
}

// encrypt the password with the random salt by md5 and store it in the localstorage
// it's at least safer than store the clear password due to the design pattern of subsonic
async function encrypt(serverInfo: ServerInfo) {
    const randomData: Uint8Array = window.crypto.getRandomValues(new Uint8Array(16));
    const salt = Array.from(randomData, byte => byte.toString(16).padStart(2, '0')).join('');
    const token: string = md5(serverInfo.password + salt)

    window.localStorage.setItem("username", serverInfo.username)
    window.localStorage.setItem("token", token)
    window.localStorage.setItem("salt", salt)
}

async function authAndUseAPI(apiName: string, ...args: [string, string | null][]) {
    const requestURL = new URL(apiName, window.localStorage.getItem("URL") as string)

    const username = window.localStorage.getItem("username")
    const salt = window.localStorage.getItem("salt")
    const token = window.localStorage.getItem("token")

    const params: [string, string | null][] = [
        ['u', username],
        ['t', token],
        ['s', salt],
        ['v', "1.16.1"],
        ['c', "rippleplayer"],
        ['f', "json"],
        ...args
    ];

    for (const [key, value] of params) {
        if (value) requestURL.searchParams.set(key, value);
    }

    requestURL.searchParams.set("u", username as string);
    requestURL.searchParams.set("t", token as string)
    requestURL.searchParams.set("s", salt as string)

    if (apiName === "stream") {
        return { data: requestURL.href }
    }

    try {
        const response = await fetch(requestURL as URL)
        const contentType = response.headers.get("content-type") ?? ""
        const isBinaryResponse = apiName === "getCoverArt"
            || apiName === "download"
            || apiName === "stream"
            || contentType.startsWith("image/")
            || contentType.startsWith("audio/")

        if (isBinaryResponse) {
            const blobData = await response.blob()
            return {
                data: URL.createObjectURL(blobData)
            }
        }

        const result = await response.json()
        if (result['subsonic-response'].status == "failed") {
            showAlert({
                content: result['subsonic-response'].error.message,
                type: "error",
            })

            return {
                message: "authentication failed"
            }
        } else if (result['subsonic-response'].status == "ok") {
            return {
                message: "authenticated",
                data: result['subsonic-response']
            }
        }
    } catch (error) {
        showAlert({
            content: "Unknown Error",
            type: "error"
        })

        return {
            message: "unknown error"
        }
    }

}

export {
    type ServerInfo,
    encrypt,
    authAndUseAPI
}