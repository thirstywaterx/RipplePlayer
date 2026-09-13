import { createRouter, createWebHashHistory } from 'vue-router'
import { storage } from '#imports';
import Home from '@/components/HomePage.vue'
import List from '@/components/ListPage.vue'
import Initialize from '@/components/InitializeServer.vue'

const getDefaultRoute = () => {
    const hasUsername = Boolean(window.localStorage.getItem('username'))
    return hasUsername ? '/home' : '/initialize'
}

const routes = [
    { path: '/', redirect: getDefaultRoute },
    { path: '/home', component: Home, name: 'home' },
    { path: '/list', component: List, name: 'list' },
    { path: '/initialize', component: Initialize, name: 'initialize' }
];

export const router = createRouter({
    // 必须使用 Hash 模式，否则扩展内部页面跳转/刷新会找不到路径
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