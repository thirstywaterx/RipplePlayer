import { defineStore } from 'pinia'

export const useSearchStore = defineStore('searchStore', () => {
    const searchText = ref('')
    const searchResult = ref<any>({})
    const isSearched = ref(false)

    return {
        searchText,
        searchResult,
        isSearched,
    }
})