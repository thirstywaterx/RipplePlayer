import { defineStore } from "pinia";

export interface ServerInfo {
    name: string,
    url: URL,
    username: string,
    token?: string,
    password?: string,
    salt?: string,
}

export const useServerInfoStore = defineStore('serverInfoStore', () => {

    const serverInfo = ref<ServerInfo[]>([])
    const nowUsingIndex = ref<number>(0)

    return {
        serverInfo,
        nowUsingIndex
    }
}, {
    persist: {
        pick: ['serverInfo', 'nowUsingIndex'],
    },
});