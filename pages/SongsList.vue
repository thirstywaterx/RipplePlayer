<template>
  <div id="songs-list-page">

    <SubBar :title="playlistInfo?.name"></SubBar>

    <div id="list-container">
      <SongContainer :songs="songs"></SongContainer>
    </div>
  </div>

</template>

<script lang="ts" setup>
import { useRoute } from 'vue-router'
import { loadCovers } from '@/utils/cover/get-cover'

import { usePlayQueueStore } from '@/store/play-queue';

import 'ms-icon/keyboard_arrow_left'

import SubBar from '@/components/SubBar.vue'
import SongContainer from '@/components/list/SongContainer.vue';

const playQueueStore = usePlayQueueStore()
const route = useRoute()

const listID = route.params.id
const requestType = route.params.type

const playlistInfo = ref<any>([])
const songs = ref<any>([])

interface RequestInfo {
  apiName: string
  mainKey: string
  subKey: string
}

let requestInfo: RequestInfo = {
  apiName: "getPlaylist",
  mainKey: "playlist",
  subKey: "entry"
}

if (requestType == "album") {
  requestInfo = {
    apiName: "getAlbum",
    mainKey: "album",
    subKey: "song"
  }
}


onMounted(async () => {
  const response = (await authAndUseAPI(requestInfo.apiName, ["id", listID as string]) as any)
  playlistInfo.value = response?.data?.[requestInfo.mainKey]
  songs.value = (await loadCovers(playlistInfo.value?.[requestInfo.subKey]))[0]

  playQueueStore.beforeLevel = "listOrAlbum"
})
</script>

<style scoped>
#songs-list-page {
  width: 100%;
  padding-bottom: 80px;
}
</style>