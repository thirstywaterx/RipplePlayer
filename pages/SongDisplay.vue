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
                <s-icon-button @click="downloadSong()">
                    <s-icon><ms-icon name="download"></ms-icon></s-icon>
                </s-icon-button>

                <s-icon-button>
                    <s-icon>
                        <ms-icon name="info"></ms-icon>
                    </s-icon>
                    <s-dialog attached>
                        <div slot="title">Song Info</div>
                        <div slot="text">
                            <div class="info-table" v-for="item in infoDialogTable" :key="item.key">
                                <div class="texts">
                                    <p>{{ item.title }}</p>
                                    <p>{{ item.content }}</p>
                                </div>
                                <s-divider></s-divider>
                            </div>
                        </div>
                        <s-button slot="action" variant="text">Got It</s-button>
                    </s-dialog>
                </s-icon-button>

            </div>
        </div>

        <div id="main-info">
            <LyricsDisplay v-if="isLyricsShowed"></LyricsDisplay>
            <img :src="String(playInfoStore.songInfo.cover)" id="cover" v-if="!isLyricsShowed">
            <OverflowMarquee id="marquee" :key="playInfoStore.songInfo.title" :animate-on-overflow-only="true"
                :clone="true" :pause-on-hover="true">
                <h1>{{ playInfoStore.songInfo.title }}</h1>
            </OverflowMarquee>
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

                <s-icon-button variant="filled" id="play-button" @click="changePlayStatus()">
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
import OverflowMarquee from '@/components/OverflowMarquee.vue'

import { updateSliderValue } from '@/utils/cal-percent';
import { loadCover } from '@/utils/cover/cover-cache';

import { playMusic, nextSong, previousSong, changeRandomStatus, changeRepeatMode, changePlayStatus } from '@/utils/player/controller';
import { downloadSong } from '@/utils/player/download';

const uiStatusStore = useUIStatusStore()
const playInfoStore = usePlayInfoStore()
const playQueueStore = usePlayQueueStore()

const progressValue = ref<number>(0)
let isSeeking = false
let pendingOffscreenTrackId: unknown = null
let activePlaybackId: number | null = null
let lastProgressSequence = -1
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
function adoptPlaybackSession(playbackId: unknown) {
    if (typeof playbackId !== 'number') return true
    if (activePlaybackId !== null && playbackId < activePlaybackId) return false
    if (playbackId > (activePlaybackId ?? -1)) {
        activePlaybackId = playbackId
        lastProgressSequence = -1
    }
    return true
}

function applyPlaybackState(state: any) {
    if (!adoptPlaybackSession(state.playbackId)) return
    if (typeof state.sequence === 'number') {
        if (state.sequence <= lastProgressSequence) return
        lastProgressSequence = state.sequence
    }

    playInfoStore.currentTime = state.currentTime ?? 0
    playInfoStore.duration = state.duration ?? 0
    playInfoStore.isPlaying = state.isPlaying ?? playInfoStore.isPlaying

    if (!isSeeking) {
        progressValue.value = updateSliderValue()
    }
}

watch(() => playInfoStore.songInfo.id, (songId) => {
    if (songId == null) return
    if (pendingOffscreenTrackId === songId) {
        pendingOffscreenTrackId = null
        return
    }

    if (!playInfoStore.songInfo.cover || String(playInfoStore.songInfo.cover).startsWith('blob:')) {
        void loadCover(playInfoStore.songInfo)
    }

    playInfoStore.currentTime = 0
    playInfoStore.duration = 0
    progressValue.value = 0
    isSeeking = false
    void playMusic()
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
        void playMusic()
    }
    return true
}

function handlePlaybackMessage(message: any) {
    if (message.target === 'popup-player' && message.action === 'PLAYER_TRACK_CHANGED') {
        if (!adoptPlaybackSession(message.playbackId)) return
        if (typeof message.sequence === 'number') {
            lastProgressSequence = Math.max(lastProgressSequence, message.sequence)
        }
        const songInfo = message.songInfo
        if (songInfo?.id != null && playInfoStore.songInfo.id !== songInfo.id) {
            pendingOffscreenTrackId = songInfo.id
            playInfoStore.songInfo = songInfo
        }
        playInfoStore.currentTime = 0
        playInfoStore.duration = 0
        playInfoStore.isPlaying = true
        progressValue.value = 0
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
        await playMusic()
        return
    }

    if (response?.status === 'seeked') {
        applyPlaybackState(response)
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

const subsonicFieldLabels: Record<string, string> = {
    id: 'ID',
    parent: 'Parent ID',
    isDir: 'Is Directory',
    title: 'Title',
    album: 'Album',
    artist: 'Artist',
    track: 'Track',
    year: 'Year',
    genre: 'Genre',
    coverArt: 'Cover Art ID',
    size: 'File Size (bytes)',
    contentType: 'Content Type',
    suffix: 'File Extension',
    duration: 'Duration (seconds)',
    bitRate: 'Bit Rate (kbps)',
    path: 'File Path',
    playCount: 'Play Count',
    discNumber: 'Disc Number',
    created: 'Date Added',
    albumId: 'Album ID',
    artistId: 'Artist ID',
    type: 'Type',
    userRating: 'Your Rating',
    averageRating: 'Average Rating',
    starred: 'Starred',
    albumArtist: 'Album Artist',
    musicBrainzId: 'MusicBrainz ID',
    channels: 'Audio Channels',
    samplingRate: 'Sample Rate (Hz)',
    bitDepth: 'Bit Depth',
    bpm: 'BPM',
    comment: 'Comment',
    sortName: 'Sort Name',
    displayArtist: 'Display Artist',
    compilation: 'Compilation',
    mediaType: 'Media Type',
    artists: 'Artists',
    albumArtists: 'Album Artists',
}

function formatInfoValue(value: unknown): string {
    if (Array.isArray(value)) {
        return value.map(formatInfoValue).filter(Boolean).join(', ')
    }

    if (value !== null && typeof value === 'object') {
        if ('name' in value) return formatInfoValue(value.name)
        return Object.entries(value)
            .map(([key, nestedValue]) => {
                const label = key
                    .replace(/([a-z0-9])([A-Z])/g, '$1 $2')
                    .replace(/^./, character => character.toUpperCase())
                const content = formatInfoValue(nestedValue)
                return content ? `${label}: ${content}` : ''
            })
            .filter(Boolean)
            .join(', ')
    }

    return value === null || value === undefined ? '' : String(value)
}

const infoDialogTable = computed(() => Object.entries(playInfoStore.songInfo)
    .filter(([key, value]) => key !== 'cover' && value !== null && value !== undefined && value !== '')
    .map(([key, value]) => ({
        key,
        title: subsonicFieldLabels[key] ?? key
            .replace(/([a-z0-9])([A-Z])/g, '$1 $2')
            .replace(/^./, character => character.toUpperCase()),
        content: formatInfoValue(value),
    }))
    .filter(item => item.content !== ''))
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

.info-table {
    width: 100%;
    display: flex;
    overflow-wrap: anywhere;
    flex-direction: column;
}

.info-table p:first-child {
    flex: 0 0 40%;
}

.info-table p:last-child {
    min-width: 0;
}

s-dialog div {
    overflow-y: auto;
    scrollbar-width: none;
    -ms-overflow-style: none;
}

s-dialog .texts {
    display: flex;
    gap: 8px;
}

s-dialog s-divider {
    width: 100vw;
}
</style>