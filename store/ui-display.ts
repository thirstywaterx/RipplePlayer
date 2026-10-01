import { defineStore } from "pinia";

export const useUIStatusStore = defineStore('', () => {
    let isMusicTabSlideIn = ref<boolean>(false)
    let isMusicTabShowed = ref<boolean>(false)

    return {
        isMusicTabShowed,
        isMusicTabSlideIn
    }
});