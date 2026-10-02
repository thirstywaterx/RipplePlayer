<template>
    <div id="list-container">
        <s-card clickable v-for="item in playlists" :key="item.id" @click="gotoSongsList(item.id)">
            <img :src="item.cover" alt="">
            <p>{{ item.name }}</p>
        </s-card>
    </div>
</template>

<script lang="ts" setup>
import { useRouter } from 'vue-router'
import { getCover } from '@/utils/cover/get-cover'

import '@/styles/list-container.css'

const router = useRouter()

const playlists = ref<any>([])

onMounted(async () => {
    playlists.value = await getCover("getPlaylists", ["playlists.playlist"])
})

function gotoSongsList(id: String) {
    router.push("/songslist/list/" + id)
}
</script>

<style scoped>
#list-container {
      padding-bottom: 80px;
}
</style>