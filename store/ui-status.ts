import { defineStore } from "pinia";

export const useUIStatusStore = defineStore('uiStatusStore', () => {
    let isMusicTabSlideIn = ref<boolean>(false)
    let isMusicTabShowed = ref<boolean>(false)
    return {
        isMusicTabShowed,
        isMusicTabSlideIn
    }
}, {
    persist: {
        pick: ['isMusicTabShowed'],
    },
});