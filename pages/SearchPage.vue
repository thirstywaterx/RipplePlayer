<template>
    <div id="page-container">
        <SearchField v-model="searchText"></SearchField>
        <p>{{ searchText }}</p>
    </div>
</template>

<script setup lang="ts">
import SearchField from '@/components/SearchField.vue';

let searchText = ref()
</script>

<style scoped>
s-text-field {
    width: 100%;
}
</style>