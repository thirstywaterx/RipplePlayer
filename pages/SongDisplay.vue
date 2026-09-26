<template>
    <div class="page-container">
        <div id="main-info">
            <img :src="songInfo.cover" alt="" id="cover">
            <h1>{{ songInfo.sortName }}</h1>
        </div>

        <div id="play-control">
            <div class="progress-control">
                <div class="progress-track" aria-hidden="true">
                    <div ref="progressFill" class="progress-fill"></div>
                </div>
                <s-slider
                    ref="progressSlider"
                    :value="0"
                    :min="0"
                    :max="100"
                    :step="1"
                    slidingmode="all"
                    :disabled="playStore.duration <= 0"
                    aria-label="progress"
                    @input="previewSeek"
                    @change="commitSeek"
                ></s-slider>
            </div>
            <s-icon-button variant="filled" id="play-button" @click="changePlayStatus()">
                <s-icon><ms-icon :key="currentPlayIcon" :name="currentPlayIcon"></ms-icon></s-icon>
            </s-icon-button>
        </div>
    </div>

</template>

<script lang="ts" setup>
import { authAndUseAPI } from '@/utils/auth'
import { loadCover } from '@/utils/cover-cache'
import { useRoute } from 'vue-router'
import { sendToPlayer } from '@/utils/playback';

import { usePlayInfoStore } from '@/store/now-playing';
const playStore = usePlayInfoStore()

import 'ms-icon/pause'
import 'ms-icon/play_arrow'

const route = useRoute()

const songID = route.params.id
const songInfo = ref<any>([])
const progressSlider = useTemplateRef<HTMLElement & { value: number }>('progressSlider')
const progressFill = useTemplateRef<HTMLElement>('progressFill')

const streamUrl = ref<string | null>(null)
const hasStarted = ref(false)
const isPlaying = ref(false)
let progressAnimation: Animation | null = null
let isSeeking = false

function applyPlaybackState(state: any) {
    const nextIsPlaying = Boolean(state.isPlaying)
    const playbackStarted = !isPlaying.value && nextIsPlaying
    playStore.currentTime = state.currentTime ?? 0
    playStore.duration = state.duration ?? 0
    isPlaying.value = nextIsPlaying
    if (!nextIsPlaying) {
        updateSliderValue()
        setProgressVisual(playStore.currentTime)
    } else {
        if (playbackStarted) updateSliderValue()
        if (!isSeeking && !progressAnimation) startProgressAnimation()
    }
}

function updateSliderValue() {
    if (!progressSlider.value) return
    progressSlider.value.value = playStore.duration > 0
        ? Math.min(100, Math.max(0, playStore.currentTime / playStore.duration * 100))
        : 0
}

function setProgressVisual(position: number, animate = false) {
    const fill = progressFill.value
    if (!fill) return

    progressAnimation?.cancel()
    progressAnimation = null

    const percent = playStore.duration > 0
        ? Math.min(100, Math.max(0, position / playStore.duration * 100))
        : 0
    const scale = percent / 100
    fill.style.transform = `scaleX(${scale})`

    if (!animate || !isPlaying.value || playStore.duration <= position) return

    const animation = fill.animate(
        [{ transform: `scaleX(${scale})` }, { transform: 'scaleX(1)' }],
        { duration: (playStore.duration - position) * 1000, easing: 'linear', fill: 'forwards' }
    )
    progressAnimation = animation
    animation.onfinish = () => {
        if (progressAnimation === animation) progressAnimation = null
    }
}

function startProgressAnimation() {
    setProgressVisual(playStore.currentTime, true)
}

function handlePlaybackMessage(message: any) {
    if (message.target !== 'popup-player' || message.action !== 'PLAYBACK_PROGRESS') return
    applyPlaybackState(message)
}

async function syncPlaybackState() {
    try {
        const state = await sendToPlayer('GET_STATE')
        applyPlaybackState(state ?? {})
    } catch {
         console.error("something wrong")
    }
}

// get the basic info of the song
onMounted(async () => {
    browser.runtime.onMessage.addListener(handlePlaybackMessage)
    void syncPlaybackState()

    const infoResponse = await authAndUseAPI("getSong", ["id", songID as string])

    if (infoResponse?.data) {
        songInfo.value = infoResponse.data.song ?? []
    }
    const streamPromise = authAndUseAPI("stream", ["id", songID as string]).then((response) => {
        if (response?.data) streamUrl.value = response.data
        return response
    })
    await loadCover(songInfo.value)
    await streamPromise
})

onUnmounted(() => {
    browser.runtime.onMessage.removeListener(handlePlaybackMessage)
    progressAnimation?.cancel()
})

const currentPlayIcon = computed(() => isPlaying.value ? "pause" : "play_arrow")

function previewSeek(event: Event) {
    const value = Number((event.currentTarget as HTMLElement & { value: number }).value)
    if (!Number.isFinite(value)) return

    isSeeking = true
    const percent = Math.min(100, Math.max(0, value))
    setProgressVisual(playStore.duration * percent / 100)
}

async function commitSeek(event: Event) {
    const value = Number((event.currentTarget as HTMLElement & { value: number }).value)
    if (!Number.isFinite(value) || playStore.duration <= 0) return

    const percent = Math.min(100, Math.max(0, value))
    const position = playStore.duration * percent / 100
    playStore.currentTime = position
    updateSliderValue()
    isSeeking = false
    setProgressVisual(position, isPlaying.value)
    await sendToPlayer('SEEK', { position })
}

async function changePlayStatus() {
    if (isPlaying.value) {
        isPlaying.value = false
        setProgressVisual(playStore.currentTime)
        await sendToPlayer('PAUSE')
        return
    }

    if (!streamUrl.value) return

    updateSliderValue()
    isPlaying.value = true
    startProgressAnimation()
    await sendToPlayer(hasStarted.value ? 'RESUME' : 'PLAY', {
        ...(hasStarted.value ? {} : { url: streamUrl.value, volume: 0.8 })
    })
    hasStarted.value = true
}
</script>

<style scoped>
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
    margin-top: 24px;
    width: 60px;
    height: 60px;
    border-radius: 1800px;
}

#play-control {
    display: flex;
    flex-direction: column;
    align-items: center;
}

.progress-control {
    position: relative;
    width: 90%;
    height: 32px;
}

.progress-track {
    position: absolute;
    top: 50%;
    right: 4px;
    left: 4px;
    height: 4px;
    overflow: hidden;
    border-radius: 999px;
    background: var(--s-color-surface-container-highest, #d9d9d9);
    transform: translateY(-50%);
    pointer-events: none;
}

.progress-fill {
    width: 100%;
    height: 100%;
    border-radius: inherit;
    background: var(--s-color-primary, #960028);
    transform: scaleX(0);
    transform-origin: left center;
    will-change: transform;
}

s-slider {
    position: absolute;
    inset: 0;
    width: 100%;
    height: 100%;
    opacity: 0;

}
</style>