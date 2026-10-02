import { defineStore } from "pinia";

type BeforeLevel = "listOrAlbum" | "empty"
type QueueSong = { id: string; [key: string]: unknown }
export type RepeatMode = "off" | "all" | "one"

export const usePlayQueueStore = defineStore('playQueueStore', () => {
    const beforeLevel = ref<BeforeLevel>("empty")
    const songsQueue = ref<QueueSong[]>([])
    const shuffleRemaining = ref<string[]>([])

    const isUIActive = ref({
        isRandomActive: false,
        repeatMode: "off" as RepeatMode
    })

    return {
        beforeLevel,
        songsQueue,
        shuffleRemaining,
        isUIActive
    }
}, {
    persist: true,
});