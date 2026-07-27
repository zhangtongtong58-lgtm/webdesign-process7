import { createRouter, createWebHashHistory, type RouteRecordRaw } from 'vue-router'
import { useAuth } from '../composables/useAuth'

const routes: RouteRecordRaw[] = [
  {
    path: '/login',
    name: 'login',
    component: () => import('../pages/login/LoginPage.vue'),
    meta: { requiresAuth: false },
  },
  {
    path: '/',
    component: () => import('../layouts/AppShell.vue'),
    meta: { requiresAuth: true },
    redirect: '/projects',
    children: [
      {
        path: 'projects',
        name: 'projects',
        component: () => import('../pages/projects/ProjectDetailPage.vue'),
      },
      {
        path: 'patches',
        name: 'patches',
        component: () => import('../pages/patches/GlobalPatchPage.vue'),
      },
      {
        path: 'testcases',
        name: 'testcases',
        component: () => import('../pages/testcases/GlobalTestCasePage.vue'),
      },
      {
        path: 'dashboard',
        name: 'dashboard',
        component: () => import('../pages/dashboard/DashboardPage.vue'),
      },
      {
        path: 'profile',
        name: 'profile',
        component: () => import('../pages/profile/PersonalCenterPage.vue'),
      },
    ],
  },
  {
    path: '/:pathMatch(.*)*',
    redirect: '/projects',
  },
]

const router = createRouter({
  history: createWebHashHistory(),
  routes,
})

router.beforeEach((to) => {
  const { isLoggedIn, isAdmin } = useAuth()
  if (to.meta.requiresAuth !== false && !isLoggedIn.value) {
    return { name: 'login', query: { redirect: to.fullPath } }
  }
  if (to.name === 'login' && isLoggedIn.value) {
    return { name: 'projects' }
  }
  if (!isAdmin.value && (to.name === 'patches' || to.name === 'testcases')) {
    return { name: 'projects' }
  }
})

export default router