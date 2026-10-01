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
                <div class="progress-track" aria-hidden="true">
                    <div ref="progressFill" class="progress-fill"></div>
                </div>
                <s-slider ref="progressSlider" :value="0" :min="0" :max="100" :step="1" slidingmode="all"
                    :disabled="playInfoStore.duration <= 0" aria-label="progress slider" @input="previewSeek"
                    @change="commitSeek"></s-slider>
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
import { loadCover } from '@/utils/cover-cache'
import { useRoute } from 'vue-router'
import { sendToPlayer } from '@/utils/playback';

import { usePlayInfoStore } from '@/store/now-playing';
import { useUIStatusStore } from '@/store/ui-display';

const uiStatusStore = useUIStatusStore()
const playInfoStore = usePlayInfoStore()

import 'ms-icon/pause'
import 'ms-icon/play_arrow'
import 'ms-icon/shuffle'
import 'ms-icon/skip_next'
import 'ms-icon/skip_previous'
import 'ms-icon/repeat'
import 'ms-icon/keyboard_arrow_down'
import 'ms-icon/download'
import 'ms-icon/info'

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

//get the current playback state from the offscreen player and apply it to the UI
function applyPlaybackState(state: any) {
    const nextIsPlaying = Boolean(state.isPlaying)
    const playbackStarted = !isPlaying.value && nextIsPlaying
    playInfoStore.currentTime = state.currentTime ?? 0
    playInfoStore.duration = state.duration ?? 0
    isPlaying.value = nextIsPlaying
    if (!nextIsPlaying) {
        updateSliderValue()
        setProgressVisual(playInfoStore.currentTime)
    } else {
        if (playbackStarted) updateSliderValue()
        if (!isSeeking && !progressAnimation) startProgressAnimation()
    }
}

function updateSliderValue() {
    if (!progressSlider.value) return
    progressSlider.value.value = playInfoStore.duration > 0
        ? Math.min(100, Math.max(0, playInfoStore.currentTime / playInfoStore.duration * 100))
        : 0
}

function setProgressVisual(position: number, animate = false) {
    const fill = progressFill.value
    if (!fill) return

    progressAnimation?.cancel()
    progressAnimation = null

    const percent = playInfoStore.duration > 0
        ? Math.min(100, Math.max(0, position / playInfoStore.duration * 100))
        : 0
    const scale = percent / 100
    fill.style.transform = `scaleX(${scale})`

    if (!animate || !isPlaying.value || playInfoStore.duration <= position) return

    const animation = fill.animate(
        [{ transform: `scaleX(${scale})` }, { transform: 'scaleX(1)' }],
        { duration: (playInfoStore.duration - position) * 1000, easing: 'linear', fill: 'forwards' }
    )
    progressAnimation = animation
    animation.onfinish = () => {
        if (progressAnimation === animation) progressAnimation = null
    }
}

function startProgressAnimation() {
    setProgressVisual(playInfoStore.currentTime, true)
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
    setProgressVisual(playInfoStore.duration * percent / 100)
}

// commit the adjustment
async function commitSeek(event: Event) {
    const value = Number((event.currentTarget as HTMLElement & { value: number }).value)
    if (!Number.isFinite(value) || playInfoStore.duration <= 0) return

    const percent = Math.min(100, Math.max(0, value))
    const position = playInfoStore.duration * percent / 100
    playInfoStore.currentTime = position
    updateSliderValue()
    isSeeking = false
    setProgressVisual(position, isPlaying.value)
    await sendToPlayer('SEEK', { position })
}

// decide the actual aciton when pressed the play/pause button
async function changePlayStatus() {
    if (isPlaying.value) {
        isPlaying.value = false
        setProgressVisual(playInfoStore.currentTime)
        await sendToPlayer('PAUSE')
        return
    }

    if (!streamUrl.value) return

    updateSliderValue()
    isPlaying.value = true
    startProgressAnimation()
    const action = hasStarted.value ? 'RESUME' : 'PLAY'
    const response = await sendToPlayer(action, {
        ...(hasStarted.value ? {} : { url: streamUrl.value, volume: 0.8 })
    })

    //if the offscreen disconnects, resume it
    if (action === 'RESUME' && response?.status === 'unavailable') {
        await sendToPlayer('PLAY', {
            url: streamUrl.value,
            volume: 0.8,
            position: playInfoStore.currentTime
        })
    }
    hasStarted.value = true
}

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