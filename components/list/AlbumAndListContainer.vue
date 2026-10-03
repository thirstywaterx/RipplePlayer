<template>
    <s-card clickable v-for="item in playlists" :key="item.id" @click="gotoSongsList(item.id)">
        <img :src="item.cover" alt="">
        <div id="info-display">
            <OverflowMarquee class="marquee" :key="item.name"
                :animate-on-overflow-only="true" :clone="true" :pause-on-hover="true">
                <p>{{ item.name }}</p>
            </OverflowMarquee>
            <div id="count-with-duration">
                <p>{{ item.songCount }} tracks </p>
                <p>{{ formatSeconds(item.duration) }}</p>
            </div>
        </div>
    </s-card>
</template>

<script setup lang="ts">
import { useRouter } from 'vue-router'
import OverflowMarquee from '@/components/OverflowMarquee.vue'
import { formatSeconds } from '@/utils/math/format-seconds'

const router = useRouter()
const props = defineProps(['playlists'])

function gotoSongsList(id: String) {
    router.push("/songslist/list/" + id)
}
</script>

<style scoped>
.marquee {
    max-width: 85%;
    min-height: 1.2em;
}

.marquee p,
#count-with-duration p {
    margin: 0;
}

#info-display {
    display: flex;
    flex-direction: column;
    width: 90%;
    min-width: 0;
}

#count-with-duration {
    display: flex;
    color: var(--s-color-outline);
    gap: 12px;
    font-size: 14px;
}
</style>