import { defineStore } from "pinia";

interface SongInfo {
    [key: string]: unknown
    title?: string
    artist?: string
}

export const usePlayInfoStore = defineStore('playInfoStore', () => {
    let currentTime = ref<number>(0)
    let duration = ref<number>(0)
    let isPlaying = ref<boolean>(false)

    let songInfo = ref<SongInfo>({})

    return {
        currentTime,
        duration,
        isPlaying,
        songInfo
    }
}, {
    persist: {
        pick: ['songInfo', 'currentTime', 'duration'],
    },
});