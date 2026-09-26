<template>
    <div id="page-container">
        <SearchField v-model="searchText" id="search-field" @keyup.enter="search()"></SearchField>
        <div id="search-result">

            <div class="large-images-container">
                <h2> Artists </h2>
                <div class="img-display">
                    <img v-for="item in searchResult.artist" :src="item.artistImageUrl" :key="item.id">
                </div>
            </div>

            <div class="large-images-container">
                <h2> Albums </h2>
                <div class="img-display">
                    <img v-for="item in searchResult.album" :src="item.artistImageUrl" :key="item.id">
                </div>
            </div>

        </div>
    </div>
</template>

<script setup lang="ts">
import SearchField from '@/components/SearchField.vue';
import { authAndUseAPI } from '#imports';

let searchText = ref<string>("")
const searchResult = ref<any>([])

async function search() {
    const infoResponse = await authAndUseAPI("search2", ["query", searchText.value])

    if (infoResponse?.data) {
        searchResult.value = infoResponse.data.searchResult2 ?? []
    }

   const albumList = searchResult.value?.album || []
    const songList = searchResult.value?.song || []

    await Promise.all([
        ...albumList.map((item: any) => loadCover(item)),
        ...songList.map((item: any) => loadCover(item))
    ])
}
</script>

<style scoped>
#page-container {
    width: 100%;
    display: flex;
    flex-direction: column;
    align-items: center;
    overflow: hidden;
}

#search-field {
    width: 100vw;
}

#search-result {
    display: flex;
    justify-content: flex-start;
    flex-direction: column;
}

.large-images-container {
    width: 100vw;
    margin-top: 10px;
    padding-left: 40px;
}

.large-images-container h2 {
    float: left;
}

.large-images-container .img-display {
    width: 100%;
    display: flex;
    justify-content: flex-start;
}

.large-images-container img {
    width: 100px;
}
</style>