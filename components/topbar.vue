<template>
  <s-tab id="top-bar">
      <s-tab-item @click="$router.push(item.path)" v-for="item in topBarList" :selected="item.slected">
        <s-icon><ms-icon :name="item.icon"></ms-icon></s-icon>
      </s-tab-item>
  </s-tab>
</template>

<script lang="ts" setup>
import 'ms-icon/home'
import 'ms-icon/list'
import 'ms-icon/search'

const topBarList = [
  {
    icon:"home",
    path:"/home",
    slected:true
  },
    {
    icon:"list",
    path:"/list"
  },
    {
    icon:"search",
    path:"/search"
  },
]
</script>

<style scoped>
#top-bar {
  position: fixed;
  width: 100%;
  height: 50px;
  top: 0;
  left: 0;
}
</style>