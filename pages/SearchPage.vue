<template>
    <div id="page-container">
        <SearchField v-model="searchText" id="search-field" @keyup.enter="search()"></SearchField>

        <s-empty v-if="!isSearched">Nothing Here</s-empty>

        <div id="search-result" v-if="isSearched">
            <div class="large-images-container">
                <h2> Artists </h2>
                <div class="img-display" @wheel.prevent="handleWheel">
                    <img v-for="item in searchResult.artist" class="artist-image" :src="item.artistImageUrl"
                        :key="item.id" @error="handleArtistImageError($event, item)"
                        @click="handleRoute('artist', item.id)">
                </div>
            </div>

            <div class="large-images-container">
                <h2> Albums </h2>
                <div class="img-display" @wheel.prevent="handleWheel">
                    <img v-for="item in searchResult.album" :src="item.cover" :key="item.id"
                        @click="handleRoute('album', item.id)">
                </div>
            </div>

            <div id="list-container">
                <s-card clickable v-for="item in searchResult.song" :key="item.id" @click="storeInfoAndOpenTab(item.id,searchResult.song)">
                    <img :src="item.cover" alt="">
                    <p>{{ item.title }}</p>
                </s-card>
            </div>

        </div>
    </div>

</template>

<script setup lang="ts">
import SearchField from '@/components/SearchField.vue';
import { authAndUseAPI } from '#imports';
import { useRouter } from 'vue-router';
import { loadCovers } from '@/utils/cover/get-cover'
import { storeInfoAndOpenTab } from '@/utils/player/open-tab';

import '@/styles/list-container.css'

const router = useRouter()

let searchText = ref<string>("")
const searchResult = ref<any>([])
const defaultArtistImage = '/default.svg'

function handleArtistImageError(event: Event, item: any) {
    if (item.artistImageUrl !== defaultArtistImage) {
        item.artistImageUrl = defaultArtistImage
    }
}

let isSearched = ref<boolean>(false)

async function search() {
    const infoResponse = await authAndUseAPI("search2", ["query", searchText.value])
    const result = infoResponse?.data?.searchResult2 ?? {}
    searchResult.value = result

    await loadCovers(searchResult.value.album ?? [], searchResult.value.song ?? [])
    isSearched.value = true
}

function handleWheel(e: WheelEvent) {
    const container = e.currentTarget as HTMLElement | null;
    if (container) {
        container.scrollLeft += e.deltaY;
    }
};

type routeType = "artist" | "album" | "song"

function handleRoute(type: routeType, id: string) {
    router.push("/songslist/" + type + "/" + id)
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



.large-images-container {
    position: relative;
    width: 100%;
    margin-top: 10px;
    padding-left: 20px;
    box-sizing: border-box;
}

:global(s-page) {
    align-items: flex-start;
    justify-content: flex-start;
    box-sizing: border-box;
    overflow-x: hidden;
    overflow-y: auto;
}

.large-images-container::after {
    content: '';
    position: absolute;
    top: 0;
    right: 0;

    width: 70px;
    height: 100%;

    background: linear-gradient(to right,
            rgba(18, 18, 18, 0) 0%,
            rgba(18, 18, 18, 0.6) 40%,
            rgba(18, 18, 18, 1) 100%);

    pointer-events: none;
    z-index: 2;
}

.large-images-container h2 {
    float: left;
}

.large-images-container .img-display {
    width: 100%;
    display: flex;
    justify-content: flex-start;
    gap: 10px;
    overflow-x: auto;

    &::-webkit-scrollbar {
        display: none;
    }

    scrollbar-width: none;

    -ms-overflow-style: none;
}

.large-images-container img {
    width: 100px;
    height: 100px;
    border-radius: 4px;
    object-fit: cover;
}

.large-images-container .artist-image {
    background: url('/default.svg') center / cover no-repeat;
}
</style>