<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import { RouterLink, useRoute, useRouter } from 'vue-router';
import { CalendarCheck, LogIn, UsersRound, XCircle } from 'lucide-vue-next';
import StatusBadge from '../components/StatusBadge.vue';
import { apiFetch } from '../services/api';
import { authState } from '../services/auth';
import type { IzccEvent } from '../types';

const route = useRoute();
const router = useRouter();
const event = ref<IzccEvent | null>(null);
const loading = ref(true);
const saving = ref(false);
const error = ref('');
const notice = ref('');
const user = computed(() => authState.user);

async function loadEvent() {
  loading.value = true;
  error.value = '';
  try {
    event.value = await apiFetch<IzccEvent>(`/events/${route.params.id}`);
  } catch (err) {
    error.value = err instanceof Error ? err.message : '活動載入失敗';
  } finally {
    loading.value = false;
  }
}

async function registerEvent() {
  if (!user.value) {
    router.push({ name: 'auth', query: { next: route.fullPath } });
    return;
  }
  saving.value = true;
  notice.value = '';
  error.value = '';
  try {
    await apiFetch(`/events/${route.params.id}/registrations`, { method: 'POST' });
    notice.value = '已完成報名';
    await loadEvent();
  } catch (err) {
    error.value = err instanceof Error ? err.message : '報名失敗';
  } finally {
    saving.value = false;
  }
}

async function cancelRegistration() {
  saving.value = true;
  notice.value = '';
  error.value = '';
  try {
    await apiFetch(`/events/${route.params.id}/registrations`, { method: 'DELETE' });
    notice.value = '已取消報名';
    await loadEvent();
  } catch (err) {
    error.value = err instanceof Error ? err.message : '取消報名失敗';
  } finally {
    saving.value = false;
  }
}

onMounted(loadEvent);
</script>

<template>
  <main class="page">
    <div v-if="loading" class="empty-state">正在載入活動。</div>
    <p v-else-if="error && !event" class="alert">{{ error }}</p>

    <section v-else-if="event" class="event-detail">
      <article>
        <img
          v-if="event.coverImageUrl"
          class="detail-cover"
          :src="event.coverImageUrl"
          :alt="event.title"
        />
        <div v-else class="detail-cover event-cover" aria-hidden="true"></div>

        <div class="section-head">
          <div>
            <p class="eyebrow">Event</p>
            <h1>{{ event.title }}</h1>
          </div>
        </div>

        <div class="content-body" v-html="event.content"></div>
      </article>

      <aside class="panel">
        <div class="section-head">
          <div>
            <p class="eyebrow">Registration</p>
            <h2>活動報名</h2>
          </div>
        </div>

        <div class="event-meta">
          <StatusBadge :status="event.status" :archived-at="event.archivedAt" />
          <span>
            <UsersRound :size="16" />
            {{ event.registrationCount }} 人報名
          </span>
        </div>

        <p v-if="notice" class="alert success">{{ notice }}</p>
        <p v-if="error" class="alert">{{ error }}</p>

        <div class="form-actions">
          <button
            v-if="event.isRegistered"
            class="button button-danger"
            type="button"
            :disabled="saving"
            @click="cancelRegistration"
          >
            <XCircle :size="18" />
            取消報名
          </button>
          <button
            v-else
            class="button"
            type="button"
            :disabled="saving"
            @click="registerEvent"
          >
            <CalendarCheck :size="18" />
            {{ user ? '我要報名' : '登入後報名' }}
          </button>
          <RouterLink v-if="!user" class="button button-secondary" :to="{ name: 'auth', query: { next: route.fullPath } }">
            <LogIn :size="18" />
            登入 / 註冊
          </RouterLink>
        </div>
      </aside>
    </section>
  </main>
</template>

