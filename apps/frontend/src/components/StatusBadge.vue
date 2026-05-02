<script setup lang="ts">
import type { EventStatus } from '../types';

const props = defineProps<{
  status: EventStatus;
  archivedAt?: string | null;
}>();

function label() {
  if (props.archivedAt) return '已封存';
  if (props.status === 'published') return '已發佈';
  if (props.status === 'unlisted') return '已下架';
  return '草稿';
}
</script>

<template>
  <span
    class="status-badge"
    :class="{
      'status-published': status === 'published' && !archivedAt,
      'status-draft': status === 'draft' && !archivedAt,
      'status-archived': archivedAt
    }"
  >
    {{ label() }}
  </span>
</template>

