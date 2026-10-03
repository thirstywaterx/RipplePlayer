<template>
  <div id="home-page">
    <div id="random-songs">
      <div id="title">
        <h2>Randoms</h2>
        <s-icon-button @click="getRandomSong()">
          <s-icon>
            <ms-icon name="refresh"></ms-icon>
          </s-icon>
        </s-icon-button>
      </div>

      <div id="list-container">
        <SongContainer :songs="randomSongs"></SongContainer>
      </div>
      
    </div>

    <template v-for="item in albumDisplayInfo.printInfo" :key="item.key">
      <WheelableLargeCoverContainer v-if="(albumDisplayInfo[item.key]?.length ?? 0) > 0" :type="item.routeType"
        :titleText="item.title" coverKey="cover" :artistsOrAlbumsData="albumDisplayInfo[item.key]" />
    </template>
  </div>
</template>

<script lang="ts" setup>
import SongContainer from '@/components/list/SongContainer.vue';
import WheelableLargeCoverContainer from '@/components/list/WheelableLargeCoverContainer.vue';
import { loadCovers } from '@/utils/cover/get-cover';

import 'ms-icon/refresh'

type DisplayType = 'mostPlayed' | 'lastPlayed' | 'recentlyAdded';
type RouteType = 'album';

interface DisplayInfo {
  printInfo: {
    title: string
    key: DisplayType
    routeType: RouteType
  }[]
  mostPlayed: any[]
  lastPlayed: any[]
  recentlyAdded: any[]
}

const albumDisplayInfo = ref<DisplayInfo>({
  printInfo: [
    {
      title: "Most Played",
      key: "mostPlayed",
      routeType: "album"
    },
    {
      title: "Last Played",
      key: "lastPlayed",
      routeType: "album"
    },
    {
      title: "Recently Added",
      key: "recentlyAdded",
      routeType: "album"
    }
  ],
  mostPlayed: [],
  lastPlayed: [],
  recentlyAdded: []
})

const randomSongs = ref<any[]>([])

async function getAlbums(type: string): Promise<any[]> {
  const response = await authAndUseAPI("getAlbumList2", ["type", type])
  const albums = response?.data?.albumList2?.album ?? []
  await loadCovers(albums)
  return albums
}

async function getRandomSong() {
  const response = await authAndUseAPI("getRandomSongs", ["size", "5"])
  randomSongs.value = response?.data.randomSongs.song
  await loadCovers(randomSongs.value)
}

onMounted(async () => {
  albumDisplayInfo.value.mostPlayed = await getAlbums("frequent")
  albumDisplayInfo.value.lastPlayed = await getAlbums("recent")
  albumDisplayInfo.value.recentlyAdded = await getAlbums("newest")
  getRandomSong()
})
</script>

<style scoped>
#home-page {
  width: 100%;
  min-width: 0;
  margin-bottom: 100px;
}

#random-songs {
  width: 100%;
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  margin-top:20px;
}

#random-songs h2 {
  margin: 0 0 0 20px;
}

#title {
  display: flex;
  flex-direction: row;
  align-items: center;
  width: 100%;
  justify-content: space-between;
  margin-bottom: 5px;
}
</style>
