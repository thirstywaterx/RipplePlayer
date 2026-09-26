<template>
    <input type="text" placeholder="Search......">
</template>

<script setup lang="ts">
const model = defineModel()
</script>

<style scoped>
input {
    width: 100vw;
    height: 40px;
    border: none;
    background-color:transparent;
    border-bottom: 2px var(--s-color-light-on-surface-variant) solid;
    padding-left: 40px;
}

input:focus{
    outline: none;
}
</style>