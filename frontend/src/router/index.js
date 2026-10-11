import { createRouter, createWebHistory } from 'vue-router'
import { useSessionStore } from '../stores/session'
import { routeDecision } from './guards'

const router = createRouter({
  history: createWebHistory(),
  routes: [
    { path: '/', redirect: '/students' },
    { path: '/login', component: () => import('../views/LoginView.vue'), meta: { title: 'Sign in' } },
    { path: '/students', component: () => import('../views/StudentsView.vue'), meta: { title: 'Students', requiresAuth: true } },
    { path: '/attendance', component: () => import('../views/AttendanceView.vue'), meta: { title: 'Attendance', requiresAuth: true } },
    { path: '/dues', component: () => import('../views/DuesView.vue'), meta: { title: 'Fee follow-up', requiresAuth: true, adminOnly: true } },
    { path: '/users', component: () => import('../views/UsersView.vue'), meta: { title: 'Team', requiresAuth: true, adminOnly: true } },
    { path: '/activity', component: () => import('../views/ActivityView.vue'), meta: { title: 'Activity', requiresAuth: true } },
    { path: '/:pathMatch(.*)*', redirect: '/' },
  ],
  scrollBehavior: () => ({ top: 0 }),
})

router.beforeEach(async (to) => {
  const session = useSessionStore()
  await session.initialize()
  return routeDecision(to, session.user)
})

export default router
