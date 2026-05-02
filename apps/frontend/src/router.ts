import { createRouter, createWebHistory } from 'vue-router';
import { authState } from './services/auth';
import HomePage from './pages/HomePage.vue';
import EventDetailPage from './pages/EventDetailPage.vue';
import AuthPage from './pages/AuthPage.vue';
import AdminPage from './pages/AdminPage.vue';
import DeployPage from './pages/DeployPage.vue';

export const router = createRouter({
  history: createWebHistory(),
  routes: [
    { path: '/', name: 'home', component: HomePage },
    { path: '/events/:id', name: 'event-detail', component: EventDetailPage },
    { path: '/auth', name: 'auth', component: AuthPage },
    {
      path: '/admin',
      name: 'admin',
      component: AdminPage,
      meta: { requiresAdmin: true }
    },
    { path: '/deploy', name: 'deploy', component: DeployPage }
  ],
  scrollBehavior() {
    return { top: 0 };
  }
});

router.beforeEach((to) => {
  if (to.meta.requiresAdmin && authState.user?.role !== 'admin') {
    return { name: 'auth', query: { next: to.fullPath } };
  }
  return true;
});

