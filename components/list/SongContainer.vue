<template>
    <s-card clickable v-for="item in songs" :key="item.id" @click="storeInfoAndOpenTab(item.id, songs)">
        <img :src="item.cover" alt="">
        <div id="info-display">
            <OverflowMarquee class="marquee" :key="item.name" :animate-on-overflow-only="true" :clone="true"
                :pause-on-hover="true">
                <p>{{ item.title }}</p>
            </OverflowMarquee>
            <div id="count-with-duration">
                <OverflowMarquee class="marquee" :key="item.name" :animate-on-overflow-only="true" :clone="true"
                    :pause-on-hover="true">
                    <p>{{ item.artist }}</p>
                    <p>{{ formatSeconds(item.duration) }}</p>
                </OverflowMarquee>
            </div>
        </div>
    </s-card>
</template>

<script setup lang="ts">
import { formatSeconds } from '@/utils/math/format-seconds'
import { storeInfoAndOpenTab } from '@/utils/player/open-tab'
import OverflowMarquee from '@/components/OverflowMarquee.vue'

const props = defineProps(['songs'])
</script>

<style scoped>
.marquee {
    max-width: 85%;
    min-height: 1.2em;
}

.marquee p {
    margin: 0;
}

#count-with-duration {
    padding-right: 6px;
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
    font-size: 14px;
}

#count-with-duration :deep(.vue3-marquee > .marquee) {
    gap: 12px;
}
</style>