<script setup lang="ts">
import { onMounted, ref } from 'vue';
import { RouterLink } from 'vue-router';
import { ArrowRight, RefreshCw } from 'lucide-vue-next';
import EventCard from '../components/EventCard.vue';
import { apiFetch } from '../services/api';
import type { IzccEvent } from '../types';

const events = ref<IzccEvent[]>([]);
const loading = ref(true);
const error = ref('');

const clubs = [
  {
    name: '成功電研 CKCSC',
    image: '/photo/ckcsc.jpg',
    text: '以程式設計為主軸，著重競技程式與專案開發，也期待推動資安 CTF 教學。'
  },
  {
    name: '建中資訊 INFOR',
    image: '/photo/infor.jpg',
    text: '以固定社課作為教學核心，內容包含 Python、C++、HTML 等多元資訊主題。'
  },
  {
    name: '中山資研 ZSISC',
    image: '/photo/zsisc.jpg',
    text: '以資訊學術為主軸，社課以 C++ 為主，和友社共同舉辦活動與交流。'
  },
  {
    name: '景美電資 CMIOC',
    image: '/photo/cmioc.jpg',
    text: '社課分成程式班與網美班，包含 C++、HTML、CSS，和四校共同辦活動。'
  }
];

async function loadEvents() {
  loading.value = true;
  error.value = '';
  try {
    events.value = await apiFetch<IzccEvent[]>('/events');
  } catch (err) {
    error.value = err instanceof Error ? err.message : '活動載入失敗';
  } finally {
    loading.value = false;
  }
}

onMounted(loadEvents);
</script>

<template>
  <main class="page">
    <section class="hero-band">
      <div class="hero-copy">
        <p class="eyebrow">INFOR / CKCSC / ZSISC / CMIOC</p>
        <h1>IZCC 四校資訊社群活動報名</h1>
        <p>
          IZCC 由建中資訊、成功電研、中山資研、景美電資組成。每年共同舉辦迎新、暑訓、
          秋遊、聯課，也會在放學後安排小社課，主題包含語法教學、專案開發、人工智慧與資訊安全。
        </p>
        <div class="form-actions">
          <a class="button" href="#events">
            <ArrowRight :size="18" />
            查看活動
          </a>
          <RouterLink class="button button-secondary" to="/auth">註冊帳號</RouterLink>
        </div>
      </div>
      <div class="club-mosaic" aria-label="四校照片">
        <div v-for="club in clubs" :key="club.name" class="club-tile">
          <img :src="club.image" :alt="club.name" />
          <span>{{ club.name.split(' ')[1] }}</span>
        </div>
      </div>
    </section>

    <section id="events" class="section-head">
      <div>
        <p class="eyebrow">Open Events</p>
        <h2>可報名活動</h2>
      </div>
      <button class="button button-secondary button-sm" type="button" @click="loadEvents">
        <RefreshCw :size="16" />
        更新
      </button>
    </section>

    <p v-if="error" class="alert">{{ error }}</p>
    <div v-else-if="loading" class="empty-state">正在整理目前開放的活動。</div>
    <div v-else-if="events.length" class="event-grid">
      <EventCard v-for="event in events" :key="event.id" :event="event" />
    </div>
    <div v-else class="empty-state">
      目前沒有開放報名的活動。請稍後再回來看看，或追蹤四校社團公告。
    </div>

    <section class="page-grid">
      <article class="panel">
        <div class="section-head">
          <div>
            <p class="eyebrow">About IZCC</p>
            <h2>一起學程式，也一起認識朋友</h2>
          </div>
        </div>
        <p class="muted">
          IZCC 以學習電腦程式設計為主，包含但不限於語法教學、專案開發、人工智慧、資訊安全等。
          歡迎有興趣的同學在這裡交新朋友、聯絡感情，也把作品和想法變成真的。
        </p>
      </article>

      <aside class="panel">
        <h2>四校組成</h2>
        <div class="club-list">
          <div v-for="club in clubs" :key="club.name" class="club-row">
            <img :src="club.image" :alt="club.name" />
            <div>
              <h3>{{ club.name }}</h3>
              <p>{{ club.text }}</p>
            </div>
          </div>
        </div>
      </aside>
    </section>
  </main>
</template>
