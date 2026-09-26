<template>
    <div id="list-container">
        <s-card clickable v-for="item in playlists" :key="item.id" @click="gotoSongsList(item.id)">
            <img :src="item.cover" alt="">
            <p>{{ item.name }}</p>
        </s-card>
    </div>
</template>

<script lang="ts" setup>
import { authAndUseAPI } from '@/utils/auth'
import { loadCover } from '@/utils/cover-cache'
import { useRouter } from 'vue-router'

import '@/styles/list-container.css'

const router = useRouter()

const playlists = ref<any>([])

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

function gotoSongsList(id: String) {
    router.push("/songslist/" + id)
}
</script>

<style scoped></style>