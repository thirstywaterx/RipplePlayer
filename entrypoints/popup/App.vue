<template>
  <s-page ref="spage" :style="{ paddingTop: isTopbarShowed ? '50px' : '0' }">
  <Topbar v-if="isTopbarShowed"></Topbar>
  <RouterView></RouterView>
  </s-page>
</template>

<script lang="ts" setup>
import 'sober'
import Topbar from '@/components/topbar.vue'
import { useRoute } from 'vue-router';
const route = useRoute()
import { createScheme } from 'sober/theme';

const spage = useTemplateRef<HTMLElement | null>('spage')

onMounted(async () => {
  const scheme = await createScheme("#960028")
  
  if (spage.value) {
    scheme.apply(spage.value)
  }
})

const isTopbarShowed = computed(() => {
  return route.name !== 'initialize'
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
