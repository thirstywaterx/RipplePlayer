import { createRouter, createWebHashHistory } from 'vue-router'

import Home from '@/pages/HomePage.vue'
import List from '@/pages/ListsPage.vue'
import Initialize from '@/pages/InitializeServer.vue'
import SongsList from '@/pages/SongsList.vue'
import SongDisplay from '@/pages/SongDisplay.vue'

const getDefaultRoute = () => {
    const hasUsername = Boolean(window.localStorage.getItem('username'))
    return hasUsername ? '/home' : '/initialize'
}

const routes = [
    { path: '/', redirect: getDefaultRoute },
    { path: '/home', component: Home, name: 'home' },
    { path: '/list', component: List, name: 'list' },
    { path: '/initialize', component: Initialize, name: 'initialize' },
    { path: '/songslist/:id', component: SongsList, name: 'songslist' },
    { path: '/song/:id', component: SongDisplay, name: 'songdisplay' }
];

export const router = createRouter({
    history: createWebHashHistory(),
    routes,
});

router.beforeEach(async (to) => {
    const isInitialized = Boolean(window.localStorage.getItem('username'))

    if (to.path === '/') {
        return getDefaultRoute()
    }

    if (!isInitialized && to.path !== '/initialize') {
        return '/initialize'
    }

    if (isInitialized && to.path === '/initialize') {
        return '/home'
    }
})