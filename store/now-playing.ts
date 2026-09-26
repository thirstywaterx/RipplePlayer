import { defineStore } from "pinia";

export const usePlayInfoStore = defineStore('', () => {
    let currentTime = ref<number>(0)
    let duration = ref<number>(0)

    return {
        currentTime,
        duration
    }
});