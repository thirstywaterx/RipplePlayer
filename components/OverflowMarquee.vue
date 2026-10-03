<template>
    <Vue3Marquee v-bind="$attrs" :class="['marquee-overflow', { 'is-overflowing': isOverflowing }]"
        @on-overflow-detected="isOverflowing = true" @on-overflow-cleared="isOverflowing = false">
        <slot />
    </Vue3Marquee>
</template>

<script setup lang="ts">
defineOptions({ inheritAttrs: false })

const isOverflowing = ref(false)
</script>