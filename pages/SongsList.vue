<template>
  <div id="songs-list-page">

    <SubBar :title="playlistInfo?.name"></SubBar>

    <div id="list-container">
      <s-card clickable v-for="item in songs" :key="item.id" @click="gotoSongDisplay(item.id)">
        <img :src="item.cover" alt="">
        <p>{{ item.sortName }}</p>
      </s-card>
    </div>
  </div>

</template>

<script lang="ts" setup>
import { useRouter } from 'vue-router'
import { useRoute } from 'vue-router'
import { loadCovers } from '@/utils/get-cover'

import 'ms-icon/keyboard_arrow_left'

import '@/styles/list-container.css'
import SubBar from '@/components/SubBar.vue'

const router = useRouter()
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
})

function gotoSongDisplay(id: String) {
  router.push("/song/" + id)
}
</script>

<style scoped>
#songs-list-page {
  width: 100%;
}
</style>