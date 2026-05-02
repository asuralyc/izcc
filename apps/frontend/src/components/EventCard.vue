<script setup lang="ts">
import { RouterLink } from 'vue-router';
import { UsersRound } from 'lucide-vue-next';
import type { IzccEvent } from '../types';
import StatusBadge from './StatusBadge.vue';

defineProps<{
  event: IzccEvent;
}>();
</script>

<template>
  <article class="event-card">
    <RouterLink :to="`/events/${event.id}`" aria-label="查看活動">
      <img
        v-if="event.coverImageUrl"
        class="event-cover"
        :src="event.coverImageUrl"
        :alt="event.title"
      />
      <div v-else class="event-cover" aria-hidden="true"></div>
    </RouterLink>
    <div class="event-card-body">
      <h3>{{ event.title }}</h3>
      <div class="event-meta">
        <StatusBadge :status="event.status" :archived-at="event.archivedAt" />
        <span>
          <UsersRound :size="15" />
          {{ event.registrationCount }} 人報名
        </span>
        <span v-if="event.isRegistered" class="status-badge status-published">已報名</span>
      </div>
    </div>
  </article>
</template>

