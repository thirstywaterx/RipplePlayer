import { createApp } from 'vue';
import './style.css';
import App from './App.vue';
import { router } from './router';
import {createPinia} from "pinia";
import piniaPluginPersistedstate from 'pinia-plugin-persistedstate';
import Vue3Marquee from 'vue3-marquee'

const pinia = createPinia();
pinia.use(piniaPluginPersistedstate);

createApp(App).use(router).use(pinia).use(Vue3Marquee).mount('#app');
