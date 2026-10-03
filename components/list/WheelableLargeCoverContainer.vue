<template>
    <div class="large-images-container">
        <h2>{{ titleText }}</h2>
        <div class="img-display" @wheel.prevent="handleWheel">
            <img v-for="item in artistsOrAlbumsData" class="artist-image" :src="item[coverKey]" :key="item.id"
                @error="handleArtistImageError($event, item)" @click="handleRoute(type, item.id)">
        </div>
    </div>
</template>

<script setup lang="ts">
import { useRouter } from 'vue-router';

const router = useRouter()
const defaultArtistImage = '/default.svg'

const props = defineProps(["titleText", "coverKey", "type", "artistsOrAlbumsData"])

type routeType = "artist" | "album" | "song"

function handleArtistImageError(event: Event, item: any) {
    if (item[props.coverKey.value] !== defaultArtistImage) {
        item[props.coverKey.value] = defaultArtistImage
    }
}

function handleRoute(type: routeType, id: string) {
    if (type === "artist") {
        router.push("/artist/" + id)
        return
    }
    router.push("/songslist/" + type + "/" + id)
}

function handleWheel(e: WheelEvent) {
    const container = e.currentTarget as HTMLElement | null;
    if (container) {
        container.scrollLeft += e.deltaY;
    }
};
</script>

<style scoped>
.large-images-container {
    position: relative;
    width: 100%;
    margin-top: 10px;
    padding-left: 20px;
    box-sizing: border-box;
}

.large-images-container::after {
    content: '';
    position: absolute;
    top: 0;
    right: 0;

    width: 70px;
    height: 100%;

    background: linear-gradient(to right,
            rgba(18, 18, 18, 0) 0%,
            rgba(18, 18, 18, 0.6) 40%,
            rgba(18, 18, 18, 1) 100%);

    pointer-events: none;
    z-index: 2;
}

.large-images-container h2 {
    float: left;
}

.large-images-container .img-display {
    width: 100%;
    display: flex;
    justify-content: flex-start;
    gap: 10px;
    overflow-x: auto;

    &::-webkit-scrollbar {
        display: none;
    }

    scrollbar-width: none;

    -ms-overflow-style: none;
}

.large-images-container img {
    width: 100px;
    height: 100px;
    border-radius: 4px;
    object-fit: cover;
}

.large-images-container .artist-image {
    background: url('/default.svg') center / cover no-repeat;
}
</style>