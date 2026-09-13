import { md5 } from 'js-md5'
import { showAlert } from '@/utils/floatAlert'
import { router } from '@/entrypoints/popup/router'

interface ServerInfo {
    URL: URL,
    username: string,
    password: string
}

// encrypt the password with the random salt by md5 and store it in the localstorage
// it's safer than store the clear password due to the design pattern of subsonic
async function encrypt(serverInfo: ServerInfo) {
    const randomData: Uint8Array = window.crypto.getRandomValues(new Uint8Array(16));
    const salt = Array.from(randomData, byte => byte.toString(16).padStart(2, '0')).join('');
    const token: string = md5(serverInfo.password + salt)

    window.localStorage.setItem("username", serverInfo.username)
    window.localStorage.setItem("token", token)
    window.localStorage.setItem("salt", salt)
}

async function getAuthParams() {
    const requestURL = new URL("ping.view", window.localStorage.getItem("URL") as string)

    const username = window.localStorage.getItem("username")
    const salt = window.localStorage.getItem("salt")
    const token = window.localStorage.getItem("token")

    const params: [string, string | null][] = [
        ['u', username],
        ['t', token],
        ['s', salt],
        ['v', "1.16.1"],
        ['c', "rippleplayer"],
        ['f', "json"]
    ];

    for (const [key, value] of params) {
        if (value) requestURL.searchParams.set(key, value);
    }

    requestURL.searchParams.set("u", username as string);
    requestURL.searchParams.set("t", token as string)
    requestURL.searchParams.set("s", salt as string)

    try {
        const response = await fetch(requestURL as URL)
        const result = await response.json()
        if (result['subsonic-response'].status == "failed") {
            showAlert({
                content: result['subsonic-response'].error.message,
                type: "error",
            })
        } else if(result['subsonic-response'].status == "ok") {
            showAlert({
                content: "The Server has been added successfully",
                type: "success"
            })
            router.replace('/home')
        }
    } catch (error) {
        showAlert({
            content: "Unkownn Error",
            type: "error"
        })
    }

}

export {
    type ServerInfo,
    encrypt,
    getAuthParams
}