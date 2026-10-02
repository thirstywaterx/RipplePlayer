<template>
    <div id="lyrics-container">
        <s-empty v-if="isEmpty">No Lyrics</s-empty>
        <div v-for="item in lyrics" v-if="!isEmpty">{{ item.value }}</div>
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
}
</style>