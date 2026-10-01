<template>
    <s-app-bar>
        <s-icon-button slot="nav" @click="$router.back()">
            <s-icon><ms-icon name="keyboard_arrow_left"></ms-icon></s-icon>
        </s-icon-button>
        <span slot="subtitle">{{ props.title }}</span>
    </s-app-bar>

    <div id="placeholder"></div>
</template>

<script setup lang="ts">
const props = defineProps(['title'])
</script>

<style scoped>
s-app-bar {
    position: fixed;
    width: 100%;
    height: 50px;
    z-index: 100;
}

#placeholder {
    position: relative;
    margin-bottom: 50px;
}

span {
    font-size: 18px;
    font-weight: 600;
}
</style>