import { createRouter, createWebHashHistory } from 'vue-router'

import Home from '@/pages/HomePage.vue'
import List from '@/pages/ListsPage.vue'
import Initialize from '@/pages/InitializeServer.vue'
import SongsList from '@/pages/SongsList.vue'
import SearchPage from '@/pages/SearchPage.vue'

const getDefaultRoute = () => {
    const hasUsername = Boolean(window.localStorage.getItem('username'))
    return hasUsername ? '/home' : '/initialize'
}

const routes = [
    { path: '/', redirect: getDefaultRoute },
    { path: '/home', component: Home, name: 'home' },
    { path: '/list', component: List, name: 'list' },
    { path: '/initialize', component: Initialize, name: 'initialize' },
    { path: '/songslist/:type/:id', component: SongsList, name: 'songslist' },
    { path: '/search', component: SearchPage, name: 'search' }
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