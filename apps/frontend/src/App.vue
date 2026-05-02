<script setup lang="ts">
import { computed } from 'vue';
import { RouterLink, RouterView, useRouter } from 'vue-router';
import { CalendarDays, LogOut, ShieldCheck, TerminalSquare, UserRound } from 'lucide-vue-next';
import { authState, logout } from './services/auth';

const router = useRouter();
const user = computed(() => authState.user);

function signOut() {
  logout();
  router.push('/');
}
</script>

<template>
  <div class="app-shell">
    <header class="site-header">
      <RouterLink class="brand-mark" to="/" aria-label="IZCC 首頁">
        <span class="brand-symbol">IZ</span>
        <span>
          <strong>IZCC</strong>
          <small>活動報名系統</small>
        </span>
      </RouterLink>

      <nav class="top-nav" aria-label="主要導覽">
        <RouterLink to="/">
          <CalendarDays :size="18" />
          活動
        </RouterLink>
        <RouterLink v-if="user?.role === 'admin'" to="/admin">
          <ShieldCheck :size="18" />
          Admin
        </RouterLink>
        <RouterLink to="/deploy">
          <TerminalSquare :size="18" />
          部署我自己
        </RouterLink>
      </nav>

      <div class="header-account">
        <RouterLink v-if="!user" class="button button-sm" to="/auth">
          <UserRound :size="17" />
          登入
        </RouterLink>
        <button v-else class="button button-sm button-ghost" type="button" @click="signOut">
          <LogOut :size="17" />
          {{ user.displayName || user.account }}
        </button>
      </div>
    </header>

    <RouterView />
  </div>
</template>

