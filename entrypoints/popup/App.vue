<template>
  <s-page ref="spage" :style="{ paddingTop: isTopbarShowed ? '50px' : '0' }">
    <Topbar></Topbar>
    <MusicTab></MusicTab>
    <RouterView></RouterView>
  </s-page>
</template>

<script lang="ts" setup>
import 'sober'
import Topbar from '@/components/Topbar.vue'
import MusicTab from '@/components/MusicTab.vue';
import { useRoute, useRouter } from 'vue-router';
import { createScheme } from 'sober/theme';
import { getColorSync } from 'colorthief';
import { usePlayInfoStore } from '@/store/now-playing';

const route = useRoute()
const router = useRouter()
const playInfoStore = usePlayInfoStore()

const spage = useTemplateRef<HTMLElement | null>('spage')
let themeRequestId = 0

onMounted(async () => {
  const scheme = await createScheme("#4287f5")

  if (spage.value) {
    scheme.apply(spage.value)
  }

  if (!window.localStorage.getItem("username") && route.path !== '/initialize') {
    router.replace('/initialize')
  }

  if (window.localStorage.getItem("username") && route.path === '/initialize') {
    router.replace('/home')
  }
})

const isTopbarShowed = computed(() => {
  return route.name !== "initialize"
})
</script>

<style scoped>
s-page {
  height: 100vh;
  width: 100vw;
  display: flex;
  justify-content: center;
  padding-top: 50px;
}
</style>
