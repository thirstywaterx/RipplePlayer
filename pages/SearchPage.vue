<template>
    <div id="page-container">
        <SearchField v-model="searchText" id="search-field" @keyup.enter="search()"></SearchField>

        <s-empty v-if="!isSearched">Nothing Here</s-empty>

        <div id="search-result" v-if="isSearched">
            <WheelableLargeCoverContainer type="artist" :artistsOrAlbumsData="searchResult.artist"  v-if="(searchResult.artist?.length ?? 0) > 0">
            </WheelableLargeCoverContainer>

            <WheelableLargeCoverContainer type="album" :artistsOrAlbumsData="searchResult.album"  v-if="(searchResult.album?.length ?? 0) > 0">
            </WheelableLargeCoverContainer>

            <div id="list-container">
                <SongContainer :songs="searchResult.song"></SongContainer>
            </div>

        </div>
    </div>

</template>

<script setup lang="ts">
import SearchField from '@/components/SearchField.vue';
import { authAndUseAPI } from '#imports';
import { loadCovers } from '@/utils/cover/get-cover'

import SongContainer from '@/components/list/SongContainer.vue';
import WheelableLargeCoverContainer from '@/components/list/WheelableLargeCoverContainer.vue';

import { usePlayQueueStore } from '@/store/play-queue';

import '@/styles/list-container.css'


const playQueueStore = usePlayQueueStore()


onMounted(() => {
    playQueueStore.beforeLevel = "empty"
})

let searchText = ref<string>("")
const searchResult = ref<any>([])

let isSearched = ref<boolean>(false)

async function search() {
    const infoResponse = await authAndUseAPI("search2", ["query", searchText.value])
    const result = infoResponse?.data?.searchResult2 ?? {}
    searchResult.value = result

    await loadCovers(searchResult.value.album ?? [], searchResult.value.song ?? [])
    isSearched.value = true
}
</script>

<style scoped>
#page-container {
    width: 100%;
    min-height: 100%;
    min-width: 0;
    display: flex;
    flex-direction: column;
    align-items: stretch;
    box-sizing: border-box;
    overflow-x: hidden;
    padding-bottom: 80px;
}

#search-field {
    width: 100vw;
    box-sizing: border-box;
}

#search-field {
    width: 100%;
    box-sizing: border-box;
}

#search-result {

    display: flex;
    justify-content: flex-start;
    flex-direction: column;
    overflow-x: hidden;
}

#search-result #list-container {
    width: 100vw;
    flex: none;
    box-sizing: border-box;
    align-self: center;
    overflow-y: visible;
    margin-top: 15px;
}

:global(s-page) {
    align-items: flex-start;
    justify-content: flex-start;
    box-sizing: border-box;
    overflow-x: hidden;
    overflow-y: auto;
}
</style>