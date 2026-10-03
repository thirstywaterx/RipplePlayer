<template>
    <div id="page-container">
        <SubBar :title="artistInfo?.name"></SubBar>
        <img :src="artistInfo?.artistImageUrl" id="artist-cover">

        <div id="options">
            <s-button variant="outlined" @click="shufflePlaySongOfArtist()">
                <s-icon>
                    <ms-icon name="shuffle"></ms-icon>
                </s-icon>
                Shuffle Play
            </s-button>

            <s-button variant="text">
                <s-icon @click="getArtistDetail()">
                    <ms-icon name="info"></ms-icon>
                </s-icon>

                <s-dialog attached>
                    <div slot="title">{{ artistInfo?.name }}</div>
                    <div slot="text">
                        {{ artistDetail?.biography }}
                    </div>
                    <s-button slot="action" variant="text">Got It</s-button>
                </s-dialog>
            </s-button>
        </div>

        <WheelableLargeCoverContainer type="album" :artistsOrAlbumsData="artistInfo?.album ?? []" v-if="(artistInfo?.album?.length ?? 0) > 0">
        </WheelableLargeCoverContainer>
    </div>
</template>

<script setup lang="ts">
import SubBar from '@/components/SubBar.vue';
import WheelableLargeCoverContainer from '@/components/list/WheelableLargeCoverContainer.vue';
import { useRoute } from 'vue-router';
import { usePlayQueueStore } from '@/store/play-queue';
import { loadCovers } from '@/utils/cover/get-cover';
import { storeInfoAndOpenTab } from '@/utils/player/open-tab';
import { shuffleSongIds } from '@/utils/player/controller';

import 'ms-icon/shuffle'

interface ArtistInfo {
    id: string
    name: string
    artistImageUrl: string,
    album: { id: string }[]
}

interface ArtistDetail {
    biography: string
    similarArtist: []
}

const route = useRoute()
const artistID: string = String(route.params.id)
const playQueueStore = usePlayQueueStore()
const artistInfo = ref<ArtistInfo | null>(null)
const artistDetail = ref<ArtistDetail | null>(null)

async function getArtistDetail() {
    const response = await authAndUseAPI('getArtistInfo', ["id", artistID])
    artistDetail.value = response?.data.artistInfo
}

async function getArtistInfo() {
    const response = await authAndUseAPI('getArtist', ["id", artistID])
    artistInfo.value = response?.data.artist
    await loadCovers(artistInfo.value?.album ?? [])
}

onMounted(async () => {
    await getArtistDetail()
    await getArtistInfo()

})

async function shufflePlaySongOfArtist() {
    const albums = artistInfo.value?.album ?? []
    const albumResponses = await Promise.all(
        albums.map(album => authAndUseAPI('getAlbum', ['id', album.id]))
    )
    const songs = albumResponses.flatMap(response => {
        const albumSongs = response?.data?.album?.song
        if (Array.isArray(albumSongs)) return albumSongs
        return albumSongs ? [albumSongs] : []
    })
    const songsByID = new Map(songs.map(song => [song.id, song]))

    if (songsByID.size === 0) return

    const shuffledSongs = shuffleSongIds([...songsByID.keys()])
        .map(songID => songsByID.get(songID)!)

    await loadCovers(shuffledSongs)
    playQueueStore.beforeLevel = 'listOrAlbum'
    await storeInfoAndOpenTab(shuffledSongs[0]!.id, shuffledSongs)
}
</script>

<style scoped>
#page-container {
    width: 100%;
    padding-bottom: 100px;
}

#artist-cover {
    width: 100%;
    height: 200px;
    object-fit: cover;
    object-position: center;
}

#options {
    width: 100%;
    display: flex;
    padding-left: 12px;
    padding-right: 12px;
    margin-top: 10px;
    justify-content: space-between;
    box-sizing: border-box;
}

s-dialog div {
    overflow-y: auto;
    scrollbar-width: none;
    -ms-overflow-style: none;
}

#artist-cover {
    background: url('/default.svg') center / cover no-repeat;
}
</style>