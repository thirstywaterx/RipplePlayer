<template>
    <div id="list-container">
        <s-card clickable v-for="item in playlists" :key="item.id">
            <img :src="item.cover" alt="">
            <p>{{ item.name }}</p>
        </s-card>
    </div>
</template>

<script lang="ts" setup>
import 'sober/styles/scrollbar.css'
import { authAndUseAPI } from '@/utils/auth'
import { getCoverFromCache, setCoverToCache } from '@/utils/coverCache'

const playlists = ref<any>([])

async function loadCover(item: any) {
    const cached = getCoverFromCache(item.id)
    if (cached) {
        item.cover = cached
        return cached
    }

    const imageURL = await authAndUseAPI("getCoverArt", ["id", item.id])
    const data = imageURL?.data

    if (data) {
        setCoverToCache(item.id, data)
        item.cover = data
    }

    return data
}

onMounted(async () => {
    const infoResponse = await authAndUseAPI("getPlaylists")

    if (infoResponse?.data) {
        playlists.value = infoResponse.data.playlists.playlist ?? []
    }

    await Promise.all(
        playlists.value.map(async (item: any) => {
            await loadCover(item)
        })
    )
})
</script>

<style scoped>
#list-container {
    position: relative;
    width: 100vw;
    overflow-y: auto;
    display: flex;
    align-items: center;
    gap: 10px;
    flex-direction: column;
    padding-top: 30px;
}

s-card {
    position: relative;
    width: 80%;
    height: 80px;
    box-shadow: none;
    flex-shrink: 0;
    display: flex;
    word-break: break-all;
    background-color: none;
}
</style>