<template>
    <div class="page-container">
        <div id="top-options">
            <s-icon-button @click="closeTab()">
                <s-icon><ms-icon name="keyboard_arrow_down"></ms-icon></s-icon>
            </s-icon-button>
            <div>
                <s-icon-button>
                    <s-icon><ms-icon name="download"></ms-icon></s-icon>
                </s-icon-button>
                <s-icon-button>
                    <s-icon><ms-icon name="info"></ms-icon></s-icon>
                </s-icon-button>
            </div>
        </div>

        <div id="main-info">
            <img :src="String(playInfoStore.songInfo.cover)" alt="" id="cover">
            <h1>{{ playInfoStore.songInfo.title }}</h1>
        </div>

        <div id="play-control">

            <div class="progress-control">
                <s-slider id="progress-slider" v-model="progressValue" :min="0" :max="100" :step="1" slidingmode="all"
                    :disabled="playInfoStore.duration <= 0" aria-label="progress slider" @input="previewProgress"
                    @change="changeProgress"></s-slider>
            </div>

            <div id="control-buttons">
                <s-icon-button>
                    <s-icon><ms-icon name="shuffle"></ms-icon></s-icon>
                </s-icon-button>

                <s-icon-button>
                    <s-icon><ms-icon name="skip_previous"></ms-icon></s-icon>
                </s-icon-button>

                <s-icon-button variant="filled" id="play-button" @click="changePlayStatus()">
                    <s-icon><ms-icon :key="currentPlayIcon" :name="currentPlayIcon"></ms-icon></s-icon>
                </s-icon-button>

                <s-icon-button>
                    <s-icon><ms-icon name="skip_next"></ms-icon></s-icon>
                </s-icon-button>

                <s-icon-button>
                    <s-icon><ms-icon name="repeat"></ms-icon></s-icon>
                </s-icon-button>

            </div>

        </div>
    </div>

</template>

<script lang="ts" setup>
import { authAndUseAPI } from '@/utils/auth'
import { sendToPlayer } from '@/utils/playback';

import { usePlayInfoStore } from '@/store/now-playing';
import { useUIStatusStore } from '@/store/ui-display';

import { updateSliderValue } from '@/utils/player/cal-percent';

const uiStatusStore = useUIStatusStore()
const playInfoStore = usePlayInfoStore()

const progressValue = ref<number>(0)
let isSeeking = false
let playRequestId = 0

import 'ms-icon/pause'
import 'ms-icon/play_arrow'
import 'ms-icon/shuffle'
import 'ms-icon/skip_next'
import 'ms-icon/skip_previous'
import 'ms-icon/repeat'
import 'ms-icon/keyboard_arrow_down'
import 'ms-icon/download'
import 'ms-icon/info'

//get the current playback state from the offscreen player and apply it to the UI
function applyPlaybackState(state: any) {
    playInfoStore.currentTime = state.currentTime ?? 0
    playInfoStore.duration = state.duration ?? 0

    if (!isSeeking) {
        progressValue.value = updateSliderValue()
    }
}

async function playMusic() {
    const songId = playInfoStore.songInfo.id
    const requestId = ++playRequestId
    const position = playInfoStore.currentTime
    const response = await authAndUseAPI("stream", ["id", String(songId)])

    if (requestId !== playRequestId || playInfoStore.songInfo.id !== songId) return

    await sendToPlayer('PLAY', {
        url: response?.data,
        position,
    })
    playInfoStore.isPlaying = true
}

watch(() => playInfoStore.songInfo.id, (songId) => {
    if (songId == null) return

    playInfoStore.currentTime = 0
    playInfoStore.duration = 0
    progressValue.value = 0
    isSeeking = false
    void playMusic()
}, { immediate: true })

async function changePlayStatus() {
    if (playInfoStore.isPlaying) {
        await sendToPlayer('PAUSE')
        playInfoStore.isPlaying = false
        return
    }

    if (playInfoStore.duration > 0) {
        const response = await sendToPlayer('RESUME')
        if (response?.status === 'unavailable') {
            await playMusic()
            return
        }
        playInfoStore.isPlaying = true
        return
    }

    await playMusic()
}

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

function handlePlaybackMessage(message: any) {
    if (message.target !== 'popup-player' || message.action !== 'PLAYBACK_PROGRESS') return
    applyPlaybackState(message)
}

onMounted(async () => {
    browser.runtime.onMessage.addListener(handlePlaybackMessage)
})

onUnmounted(() => {
    browser.runtime.onMessage.removeListener(handlePlaybackMessage)
})

const currentPlayIcon = computed(() => playInfoStore.isPlaying ? "pause" : "play_arrow")

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