import { createRouter, createWebHashHistory } from 'vue-router'

import Home from '@/pages/HomePage.vue'
import List from '@/pages/ListsPage.vue'
import AddServer from '@/pages/AddServer.vue'
import SongsList from '@/pages/SongsList.vue'
import SearchPage from '@/pages/SearchPage.vue'
import ArtistDetail from '@/pages/ArtistDetail.vue'

const getDefaultRoute = () => {
    const hasUsername = Boolean(window.localStorage.getItem('username'))
    return hasUsername ? '/home' : '/addserver'
}

const routes = [
    { path: '/', redirect: getDefaultRoute },
    { path: '/home', component: Home, name: 'home' },
    { path: '/list', component: List, name: 'list' },
    { path: '/addserver', component: AddServer, name: 'addserver' },
    { path: '/songslist/:type/:id', component: SongsList, name: 'songslist' },
    { path: '/search', component: SearchPage, name: 'search' },
    { path: '/artist/:id', component: ArtistDetail, name: 'artist' },
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

    if (!isInitialized && to.path !== '/addserver') {
        return '/addserver'
    }
})