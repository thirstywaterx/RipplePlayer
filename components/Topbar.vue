<template>
  <div id="top-bar">

    <s-tab id="menu">
      <s-tab-item @click="$router.push(item.path)" v-for="item in topBarList" :selected="item.slected">
        <s-icon><ms-icon :name="item.icon"></ms-icon></s-icon>
      </s-tab-item>
    </s-tab>

    <div id="options">
      <s-icon-button @click="logout()">
        <s-icon><ms-icon name="logout"></ms-icon></s-icon>
      </s-icon-button>
    </div>
  </div>
</template>

<script lang="ts" setup>
import 'ms-icon/home'
import 'ms-icon/list'
import 'ms-icon/search'
import 'ms-icon/logout'

import { useRouter } from 'vue-router'
import { usePlayInfoStore } from '../store/now-playing'
import { usePlayQueueStore } from '../store/play-queue'
import { useUIStatusStore } from '../store/ui-status'
const router = useRouter()
const playInfoStore = usePlayInfoStore()
const playQueueStore = usePlayQueueStore()
const uiStatusStore = useUIStatusStore()

const topBarList = [
  {
    icon: "home",
    path: "/home",
    slected: true
  },
  {
    icon: "list",
    path: "/list"
  },
  {
    icon: "search",
    path: "/search"
  },
]

async function logout() {
  playInfoStore.currentTime = 0
  playInfoStore.duration = 0
  playInfoStore.isPlaying = false
  playInfoStore.songInfo = {}

  playQueueStore.beforeLevel = 'empty'
  playQueueStore.songsQueue = []
  playQueueStore.shuffleRemaining = []
  playQueueStore.isUIActive = {
    isRandomActive: false,
    repeatMode: 'off'
  }
  uiStatusStore.isMusicTabShowed = false
  uiStatusStore.isMusicTabSlideIn = false

  await browser.runtime.sendMessage({
    target: 'offscreen-player',
    action: 'STOP'
  }).catch(() => {})
  router.replace("/addserver")
}
</script>

<style scoped>
#top-bar {
  position: fixed;
  width: 100%;
  height: 55px;
  top: 0px;
  left: 0;
  z-index: 100;
  display: flex;
  align-items: center;
  justify-content: space-around;
}

#menu {
  width: 100vw;
  height: 100%;
}

#options {
  position: fixed;
  right: 10px;
}
</style>