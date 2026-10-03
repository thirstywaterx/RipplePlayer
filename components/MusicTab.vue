<template>
    <div id="overall" :class="{ 'all-slide-in': uiStatusStore.isMusicTabSlideIn }"
        v-if="uiStatusStore.isMusicTabShowed">
        <s-card id="tab-container" @click="handleClick()">
            <s-progress :value="progressValue"></s-progress>
            <img :src="String(playInfoStore.songInfo.cover)" alt="" id="cover">
            <div id="text-info">
                <OverflowMarquee id="marquee" :key="playInfoStore.songInfo.title"
                    :animate-on-overflow-only="true" :clone="true" :pause-on-hover="true">
                    <h4>{{ playInfoStore.songInfo.title }}</h4>
                </OverflowMarquee>
                <OverflowMarquee id="marquee" :key="playInfoStore.songInfo.title"
                    :animate-on-overflow-only="true" :clone="true" :pause-on-hover="true">
                    <p style="color: var(--s-color-outline);">{{ playInfoStore.songInfo.artist }}</p>
                </OverflowMarquee>
            </div>
        </s-card>

        <SongDisplay id="song-display"></SongDisplay>
    </div>

</template>

<script setup lang="ts">
import SongDisplay from '@/pages/SongDisplay.vue';
import { useUIStatusStore } from '@/store/ui-status';
import { usePlayInfoStore } from '@/store/now-playing';
import { updateSliderValue } from '@/utils/cal-percent';
import OverflowMarquee from '@/components/OverflowMarquee.vue'

const uiStatusStore = useUIStatusStore()
const playInfoStore = usePlayInfoStore()
let playRequestId = 0

const progressValue = computed(() => {
    return updateSliderValue();
});

function handleClick() {
    uiStatusStore.isMusicTabSlideIn = !uiStatusStore.isMusicTabSlideIn
}
</script>

<style scoped>
#overall {
    position: fixed;
    bottom: -100vh;
    z-index: 101;
    transform: translateY(0);
    transition: transform 0.3s ease-in-out;
}

#tab-container {
    height: 64px;
    display: flex;
    align-items: center;
    width: 100vw;
    border-radius: 0;
    padding-left: 10px;
    background-color: var(--s-color-surface-container-low);
}

#cover {
    width: 45px;
}

s-progress {
    position: absolute;
    width: 100vw;
    height: 2px;
    top: 0px;
    left: 0;
}

#text-info {
    display: flex;
    padding-left: 16px;
    flex-direction: column;
    text-align: left;
}

#text-info h4,
p {
    margin: -2px;
}

#song-display {
    background-color: var(--s-color-surface-container-lowest);
    margin-top: -2px;
    height: 100vh;
}

.all-slide-in {
    animation: slide-in forwards;
}

#overall.all-slide-in {
    transform: translateY(-100vh);
}

#marquee {
    width: 60vw;
    overflow-y: hidden;
    padding-left: 1px;
}
</style>