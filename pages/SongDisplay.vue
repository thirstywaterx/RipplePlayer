<template>
    <div class="page-container">
        <div id="top-options">
            <s-icon-button @click="closeTab()">
                <s-icon><ms-icon name="keyboard_arrow_down"></ms-icon></s-icon>
            </s-icon-button>
            <div>
                <s-icon-button type="checkbox" variant="outlined" @click="isLyricsShowed = !isLyricsShowed">
                    <s-icon><ms-icon name="lyrics"></ms-icon></s-icon>
                </s-icon-button>
                <s-icon-button>
                    <s-icon><ms-icon name="download"></ms-icon></s-icon>
                </s-icon-button>
                <s-icon-button>
                    <s-icon><ms-icon name="info"></ms-icon></s-icon>
                </s-icon-button>
            </div>
        </div>

        <div id="main-info">
            <LyricsDisplay v-if="isLyricsShowed"></LyricsDisplay>
            <img :src="String(playInfoStore.songInfo.cover)" id="cover" v-if="!isLyricsShowed">
            <Vue3Marquee id="marquee" :key="playInfoStore.songInfo.title"
                :class="{ 'is-overflowing': isMarqueeOverflowing }" :animate-on-overflow-only="true" :clone="true"
                :pause-on-hover="true" @on-overflow-detected="isMarqueeOverflowing = true"
                @on-overflow-cleared="isMarqueeOverflowing = false">
                <h1>{{ playInfoStore.songInfo.title }}</h1>
            </Vue3Marquee>
        </div>

        <div id="play-control">

            <div class="progress-control">
                <s-slider id="progress-slider" v-model="progressValue" :min="0" :max="100" :step="1" slidingmode="all"
                    :disabled="playInfoStore.duration <= 0" aria-label="progress slider" @input="previewProgress"
                    @change="changeProgress"></s-slider>
            </div>

            <div id="control-buttons">
                <s-icon-button @change="changeRandomStatus()" :checked="playQueueStore.isUIActive.isRandomActive"
                    type="checkbox" variant="outlined">
                    <s-icon><ms-icon name="shuffle"></ms-icon></s-icon>
                </s-icon-button>

                <s-icon-button @click="previousSong()">
                    <s-icon><ms-icon name="skip_previous"></ms-icon></s-icon>
                </s-icon-button>

                <s-icon-button variant="filled" id="play-button" @click="changePlayStatus(playRequestId)">
                    <s-icon><ms-icon :key="currentPlayIcon" :name="currentPlayIcon"></ms-icon></s-icon>
                </s-icon-button>

                <s-icon-button @click="advanceSong()">
                    <s-icon><ms-icon name="skip_next"></ms-icon></s-icon>
                </s-icon-button>

                <s-icon-button @click="changeRepeatMode()"
                    :variant="playQueueStore.isUIActive.repeatMode === 'off' ? 'outlined' : 'tonal'">
                    <s-icon><ms-icon :key="repeatIcon" :name="repeatIcon"></ms-icon></s-icon>
                </s-icon-button>

            </div>

        </div>
    </div>

</template>

<script lang="ts" setup>
import { sendToPlayer } from '@/utils/playback';

import { usePlayInfoStore } from '@/store/now-playing';
import { usePlayQueueStore } from '@/store/play-queue';
import { useUIStatusStore } from '@/store/ui-status';

import { updateSliderValue } from '@/utils/cal-percent';
import { loadCover } from '@/utils/cover/cover-cache';

import { playMusic, nextSong, previousSong, changeRandomStatus, changeRepeatMode, changePlayStatus } from '@/utils/player/controller';

const uiStatusStore = useUIStatusStore()
const playInfoStore = usePlayInfoStore()
const playQueueStore = usePlayQueueStore()

const progressValue = ref<number>(0)
let isSeeking = false
let playRequestId = 0
const isMarqueeOverflowing = ref<boolean>(false)

const isLyricsShowed = ref<boolean>(false)

import 'ms-icon/pause'
import 'ms-icon/play_arrow'
import 'ms-icon/shuffle'
import 'ms-icon/skip_next'
import 'ms-icon/skip_previous'
import 'ms-icon/repeat'
import 'ms-icon/repeat_one'
import 'ms-icon/keyboard_arrow_down'
import 'ms-icon/download'
import 'ms-icon/info'
import 'ms-icon/lyrics'
import LyricsDisplay from '@/components/LyricsDisplay.vue';

//get the current playback state from the offscreen player and apply it to the UI
function applyPlaybackState(state: any) {
    playInfoStore.currentTime = state.currentTime ?? 0
    playInfoStore.duration = state.duration ?? 0
    playInfoStore.isPlaying = state.isPlaying ?? playInfoStore.isPlaying

    if (!isSeeking) {
        progressValue.value = updateSliderValue()
    }
}

watch(() => playInfoStore.songInfo.id, (songId) => {
    if (songId == null) return

    if (!playInfoStore.songInfo.cover || String(playInfoStore.songInfo.cover).startsWith('blob:')) {
        void loadCover(playInfoStore.songInfo)
    }

    playInfoStore.currentTime = 0
    playInfoStore.duration = 0
    progressValue.value = 0
    isSeeking = false
    void playMusic(playRequestId)
})

function previewProgress() {
    isSeeking = true
}

async function changeProgress() {
    const percent = Math.min(100, Math.max(0, progressValue.value))
    const position = playInfoStore.duration * percent / 100
    playInfoStore.currentTime = position
    progressValue.value = percent
    isSeeking = false
    await sendToPlayer('SEEK', { position })
}

function advanceSong() {
    const currentSongId = playInfoStore.songInfo.id
    if (!nextSong()) return false

    if (playInfoStore.songInfo.id === currentSongId) {
        playInfoStore.currentTime = 0
        progressValue.value = 0
        void playMusic(playRequestId)
    }
    return true
}

function handlePlaybackMessage(message: any) {
    if (message.action === 'MUSIC_ENDED') {
        if (playQueueStore.isUIActive.repeatMode === 'one') {
            playInfoStore.currentTime = 0
            progressValue.value = 0
            void playMusic(playRequestId)
        } else if (!advanceSong()) {
            playInfoStore.isPlaying = false
        }
        return
    }

    if (message.target !== 'popup-player' || message.action !== 'PLAYBACK_PROGRESS') return
    applyPlaybackState(message)
}

onMounted(async () => {
    browser.runtime.onMessage.addListener(handlePlaybackMessage)
    if (playInfoStore.songInfo.id == null) return

    if (!playInfoStore.songInfo.cover || String(playInfoStore.songInfo.cover).startsWith('blob:')) {
        void loadCover(playInfoStore.songInfo)
    }

    const response = await sendToPlayer('SEEK', { position: playInfoStore.currentTime })
    if (response?.status === 'unavailable') {
        await playMusic(playRequestId)
        return
    }

    if (response?.status === 'seeked') {
        playInfoStore.currentTime = response.currentTime ?? playInfoStore.currentTime
        playInfoStore.duration = response.duration ?? playInfoStore.duration
        playInfoStore.isPlaying = response.isPlaying ?? playInfoStore.isPlaying
        progressValue.value = updateSliderValue()
    }
})

onUnmounted(() => {
    browser.runtime.onMessage.removeListener(handlePlaybackMessage)
})

const currentPlayIcon = computed(() => playInfoStore.isPlaying ? "pause" : "play_arrow")
const repeatIcon = computed(() => playQueueStore.isUIActive.repeatMode === 'one' ? 'repeat_one' : 'repeat')


function closeTab() {
    uiStatusStore.isMusicTabSlideIn = false
}
</script>

<style scoped>
#top-options {
    position: relative;
    top: 12px;
    display: flex;
    justify-content: space-between;
    padding-left: 10px;
    padding-right: 10px;
    margin-bottom: 20px;
}

#main-info {
    display: flex;
    flex-direction: column;
    align-items: center;
    padding-top: 24px;
}

#cover {
    width: 80%;
    margin-bottom: 20px;
}

#marquee {
    width: 85vw;
    justify-content: center;
}

h1 {
    font-size: 1.5rem;
}

#play-button {
    width: 60px;
    height: 60px;
    border-radius: 1800px;
}

#play-control {
    width: 100%;
    height: 200px;
    display: flex;
    flex-direction: column;
    align-items: center;
}

#control-buttons {
    width: 100%;
    height: 80px;
    display: flex;
    justify-content: center;
    align-items: center;
    gap: 10px;
    margin-top: 20px;
}

s-slider {
    position: relative;
    inset: 0;
    width: 80vw;
    height: 32px;
}
</style>