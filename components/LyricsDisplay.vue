<template>
    <div id="lyrics-container" ref="lyricsContainer">
        <s-empty v-if="isEmpty">No Lyrics</s-empty>
        <template v-else>
            <button
                v-for="(item, index) in lyrics"
                :key="index"
                type="button"
                class="lyric-line"
                :class="{ active: index === activeLyricIndex }"
                :data-lyric-index="index"
                :disabled="!hasTimestamp(item)"
                @click="seekToLine(item)"
            >
                {{ item.value }}
                <s-ripple></s-ripple>
            </button>
        </template>
    </div>
</template>

<script setup lang="ts">
import { usePlayInfoStore } from '@/store/now-playing';
const playInfoStore = usePlayInfoStore()

interface LyricLine {
    start?: number;
    value: string;
}

const lyrics = ref<LyricLine[]>([]);
const isEmpty = ref<boolean>(true)
const lyricsContainer = ref<HTMLElement | null>(null)

const activeLyricIndex = computed(() => {
    const currentTimeMs = playInfoStore.currentTime * 1000
    let activeIndex = -1

    lyrics.value.forEach((line, index) => {
        if (typeof line.start === 'number' && Number.isFinite(line.start) && line.start <= currentTimeMs) {
            activeIndex = index
        }
    })

    return activeIndex
})

function hasTimestamp(line: LyricLine) {
    return typeof line.start === 'number' && Number.isFinite(line.start)
}

async function seekToLine(line: LyricLine) {
    if (!hasTimestamp(line)) return

    const position = Math.max(0, line.start! / 1000)
    playInfoStore.currentTime = position
    await sendToPlayer('SEEK', { position })
}

watch(activeLyricIndex, async (index) => {
    if (index < 0) return

    await nextTick()
    const container = lyricsContainer.value
    const activeLine = container?.querySelector<HTMLElement>(`[data-lyric-index="${index}"]`)
    if (!container || !activeLine) return

    container.scrollTo({
        top: activeLine.offsetTop - (container.clientHeight - activeLine.offsetHeight) / 2,
        behavior: 'smooth',
    })
})

async function getLyrics() {
    try {
        const response = await authAndUseAPI("getLyricsBySongId", ["id", String(playInfoStore.songInfo.id)])
        const lines = response?.data?.lyricsList?.structuredLyrics?.[0]?.line

        if (!Array.isArray(lines) || lines.length === 0) {
            lyrics.value = []
            isEmpty.value = true
            return
        }

        lyrics.value = lines
        isEmpty.value = false
    } catch {
        lyrics.value = []
        isEmpty.value = true
    }
}


watch(() => playInfoStore.songInfo.id, () => {
    getLyrics()
}, { immediate: true })

</script>

<style scoped>
#lyrics-container {
    position: relative;
    width: 90vw;
    height: 256px;
    overflow-y: auto;
    scrollbar-width: none;
    -ms-overflow-style: none;
    margin-bottom: 20px;
    scroll-behavior: smooth;
}

.lyric-line {
    position: relative;
    display: block;
    width: 100%;
    padding: 8px 12px;
    border: 0;
    background: transparent;
    color: inherit;
    font: inherit;
    line-height: 1.5;
    text-align: center;
    cursor: pointer;
    opacity: 0.58;
    transition: color 160ms ease, opacity 160ms ease, transform 160ms ease;
    font-weight: 600;
}

.lyric-line:disabled {
    cursor: default;
}

.lyric-line:focus {
    outline: none;
    box-shadow: none;
}

.lyric-line.active {
    color: var(--s-color-primary, currentColor);
    opacity: 1;
    transform: scale(1.03);
}

</style>