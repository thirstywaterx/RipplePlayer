<template>
  <div id="list-container">
    <s-card clickable v-for="item in songs" :key="item.id" @click="gotoSongDisplay(item.id)">
      <img :src="item.cover" alt="">
      <p>{{ item.sortName }}</p>
    </s-card>
  </div>
</template>

<script lang="ts" setup>
import { authAndUseAPI } from '@/utils/auth'
import { loadCover } from '@/utils/cover-cache'
import { useRouter } from 'vue-router'
import { useRoute } from 'vue-router'

import '@/styles/list-container.css'

const router = useRouter()
const route = useRoute()

const listID = route.params.id

const songs = ref<any>([])

onMounted(async () => {
  const infoResponse = await authAndUseAPI("getPlaylist", ["id", listID as string])

  if (infoResponse?.data) {
    songs.value = infoResponse.data.playlist.entry ?? []
  }

  await Promise.all(
    songs.value.map(async (item: any) => {
      await loadCover(item)
    })
  )
})

function gotoSongDisplay(id: String) {
  router.push("/song/" + id)
}
</script>

<style scoped></style>