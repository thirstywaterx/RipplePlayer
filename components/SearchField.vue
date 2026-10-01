<template>
    <input type="text" placeholder="Search......" v-model="model">
</template>

<script setup lang="ts">
const model = defineModel()
</script>

<style scoped>
input {
    width: 100%;
    height: 45px;
    border: none;
    background-color:transparent;
    border-bottom: 2px var(--s-color-light-on-surface-variant) solid;
    padding-left: 20px;
    font-size: 15px;
}

input:focus{
    outline: none;
}
</style>