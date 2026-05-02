<script setup lang="ts">
import { computed, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { LogIn, UserPlus } from 'lucide-vue-next';
import { login, register } from '../services/auth';

const route = useRoute();
const router = useRouter();
const mode = ref<'login' | 'register'>('login');
const account = ref('');
const email = ref('');
const displayName = ref('');
const password = ref('');
const error = ref('');
const saving = ref(false);
const nextPath = computed(() => String(route.query.next || '/'));

async function submit() {
  saving.value = true;
  error.value = '';
  try {
    const user =
      mode.value === 'login'
        ? await login(account.value, password.value)
        : await register(email.value, password.value, displayName.value);
    router.push(user.role === 'admin' && nextPath.value === '/' ? '/admin' : nextPath.value);
  } catch (err) {
    error.value = err instanceof Error ? err.message : '登入失敗';
  } finally {
    saving.value = false;
  }
}
</script>

<template>
  <main class="page">
    <section class="auth-wrap">
      <div class="panel">
        <p class="eyebrow">Account</p>
        <h1>登入 IZCC 活動報名系統</h1>
        <p class="muted">
          一般帳號註冊時必須使用 email。Admin 帳號由主機環境變數建立，預設帳號名稱可設定為
          <code>admin</code>，不開放前台自行升級。
        </p>
      </div>

      <form class="auth-panel" @submit.prevent="submit">
        <div class="tab-row" role="tablist" aria-label="登入或註冊">
          <button
            type="button"
            :class="{ active: mode === 'login' }"
            @click="mode = 'login'"
          >
            登入
          </button>
          <button
            type="button"
            :class="{ active: mode === 'register' }"
            @click="mode = 'register'"
          >
            註冊
          </button>
        </div>

        <div class="form-grid">
          <label v-if="mode === 'login'" class="field">
            <span>帳號</span>
            <input v-model.trim="account" autocomplete="username" required placeholder="email 或 admin" />
          </label>

          <template v-else>
            <label class="field">
              <span>Email</span>
              <input v-model.trim="email" type="email" autocomplete="email" required placeholder="name@example.com" />
            </label>
            <label class="field">
              <span>顯示名稱</span>
              <input v-model.trim="displayName" autocomplete="name" required placeholder="你的名字或暱稱" />
            </label>
          </template>

          <label class="field">
            <span>密碼</span>
            <input v-model="password" type="password" autocomplete="current-password" required minlength="8" />
          </label>

          <p v-if="error" class="alert">{{ error }}</p>

          <button class="button" type="submit" :disabled="saving">
            <LogIn v-if="mode === 'login'" :size="18" />
            <UserPlus v-else :size="18" />
            {{ mode === 'login' ? '登入' : '建立帳號' }}
          </button>
        </div>
      </form>
    </section>
  </main>
</template>

