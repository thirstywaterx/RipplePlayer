<template>
    <div id="list-container">
        <AlbumAndListContainer :playlists="playlists"></AlbumAndListContainer>
    </div>
</template>

<script lang="ts" setup>
import { getCover } from '@/utils/cover/get-cover'

import '@/styles/list-container.css'
import AlbumAndListContainer from '@/components/list/AlbumAndListContainer.vue'



const playlists = ref<any>([])

onMounted(async () => {
    playlists.value = await getCover("getPlaylists", ["playlists.playlist"])
})
</script>

<style scoped>
#list-container {
      padding-bottom: 80px;
}
</style>