import { createRouter, createWebHashHistory, stringifyQuery } from 'vue-router'
import { storage } from '#imports';
import Home from '@/components/Home.vue'
import List from '@/components/List.vue'
import Initialize from '@/components/Initialize.vue'

const routes = [
    { path: '/home', component: Home, name: 'home' },
    { path: '/list', component: List, name: 'list' },
    { path: '/initialize', component: Initialize, name: 'initialize' }
];

export const router = createRouter({
    // 必须使用 Hash 模式，否则扩展内部页面跳转/刷新会找不到路径
    history: createWebHashHistory(),
    routes,
});

router.beforeEach(async (to, from) => {
let isInitialized = await storage.getItem('local:isInitialized')

if (!isInitialized && to.path !== '/initialize') {
        return '/initialize'
    }
})