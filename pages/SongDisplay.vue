<template>
    <div class="page-container">
        <div id="main-info">
            <img :src="songInfo.cover" alt="" id="cover">
            <h1>{{ songInfo.sortName }}</h1>
        </div>

        <div id="play-control">
            <s-slider :value="playPercent"></s-slider>
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
import { Howl } from 'howler';

import 'ms-icon/pause'
import 'ms-icon/play_arrow'

const route = useRoute()

const songID = route.params.id
const songInfo = ref<any>([])

const sound = shallowRef<Howl | null>(null)

// get basic info of the song
onMounted(async () => {
    const infoResponse = await authAndUseAPI("getSong", ["id", songID as string])

    if (infoResponse?.data) {
        songInfo.value = infoResponse.data.song ?? []
    }
    await loadCover(songInfo.value)

    const streamResponse = await authAndUseAPI("stream", ["id", songID as string])
    if (streamResponse?.data) {
        sound.value = new Howl({
            src: [streamResponse.data],
            html5: true,
            onplay: function () {
                requestAnimationFrame(updateProgress);
            }
        })
    }
})

const playPercent = ref<number>(0)

// get the progress immediately
function updateProgress() {
    if (sound.value?.playing()) {
        const currentTime = sound.value.seek();
        const duration = sound.value.duration();

        if (duration > 0) {
            playPercent.value = (currentTime / duration) * 100;

        }
        requestAnimationFrame(updateProgress);
    }
}

const isPlaying = ref(false)
const currentPlayIcon = computed(() => isPlaying.value ? "pause" : "play_arrow")

function changePlayStatus() {
    if (!isPlaying.value) {
        sound.value?.play()
        isPlaying.value = true
        return
    }
    sound.value?.pause()
    isPlaying.value = false
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
    border-radius: 1800px;
}

#play-control {
    display: flex;
    flex-direction: column;
    align-items: center;
}

s-slider {
    width: 100px;
    --s-slider-thumb-size:10px;
}
</style>