export function routeDecision(to, user) {
  if (to.path === '/login' && user) return '/students'
  if (to.meta.requiresAuth && !user) return { path: '/login', query: { redirect: to.fullPath } }
  if (to.meta.adminOnly && user?.role !== 'ADMIN') return '/students'
  return undefined
}
