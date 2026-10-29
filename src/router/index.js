import { createRouter, createWebHistory } from 'vue-router'

export const routes = [
  { path: '/', name: 'Index', redirect: { name: 'Blogs' } },
  { path: '/login', name: 'Login', component: () => import('../views/Login.vue') },
  { path: '/blogs', name: 'Blogs', component: () => import('../views/Blogs.vue') },
  { path: '/my/blogs', name: 'MyBlogs', meta: { requireAuth: true }, component: () => import('../views/MyBlogs.vue') },
  { path: '/blog/add', name: 'BlogAdd', meta: { requireAuth: true }, component: () => import('../views/BlogEdit.vue') },
  { path: '/blog/:blogId', name: 'BlogDetail', component: () => import('../views/BlogDetail.vue') },
  { path: '/blog/:blogId/edit', name: 'BlogEdit', meta: { requireAuth: true }, component: () => import('../views/BlogEdit.vue') },
  { path: '/:pathMatch(.*)*', name: 'NotFound', component: () => import('../views/NotFound.vue') }
]

export default createRouter({ history: createWebHistory(import.meta.env.BASE_URL), routes })
