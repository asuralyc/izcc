<script setup lang="ts">
import { onMounted, reactive, ref } from 'vue';
import {
  ArchiveRestore,
  ArchiveX,
  Eye,
  EyeOff,
  FilePlus2,
  Pencil,
  Save,
  Trash2,
  Upload,
  UsersRound
} from 'lucide-vue-next';
import RichEditor from '../components/RichEditor.vue';
import StatusBadge from '../components/StatusBadge.vue';
import { apiFetch } from '../services/api';
import type { IzccEvent, Registration } from '../types';

const events = ref<IzccEvent[]>([]);
const registrations = ref<Registration[]>([]);
const registrationEvent = ref<IzccEvent | null>(null);
const loading = ref(true);
const saving = ref(false);
const error = ref('');
const notice = ref('');

const form = reactive({
  id: '',
  title: '',
  coverImageUrl: '',
  content: ''
});

async function loadEvents() {
  loading.value = true;
  error.value = '';
  try {
    events.value = await apiFetch<IzccEvent[]>('/admin/events');
  } catch (err) {
    error.value = err instanceof Error ? err.message : 'Admin 活動載入失敗';
  } finally {
    loading.value = false;
  }
}

function resetForm() {
  form.id = '';
  form.title = '';
  form.coverImageUrl = '';
  form.content = '';
  notice.value = '';
  error.value = '';
}

function editEvent(event: IzccEvent) {
  form.id = event.id;
  form.title = event.title;
  form.coverImageUrl = event.coverImageUrl ?? '';
  form.content = event.content;
  notice.value = '';
  error.value = '';
}

async function saveEvent() {
  saving.value = true;
  error.value = '';
  notice.value = '';
  const payload = {
    title: form.title,
    coverImageUrl: form.coverImageUrl || null,
    content: form.content
  };
  try {
    const event = form.id
      ? await apiFetch<IzccEvent>(`/admin/events/${form.id}`, {
          method: 'PATCH',
          body: JSON.stringify(payload)
        })
      : await apiFetch<IzccEvent>('/admin/events', {
          method: 'POST',
          body: JSON.stringify(payload)
        });
    notice.value = form.id ? '活動已更新' : '活動已新增';
    form.id = event.id;
    await loadEvents();
  } catch (err) {
    error.value = err instanceof Error ? err.message : '儲存失敗';
  } finally {
    saving.value = false;
  }
}

async function uploadCover(event: Event) {
  const input = event.target as HTMLInputElement;
  const file = input.files?.[0];
  if (!file) return;

  saving.value = true;
  error.value = '';
  try {
    const body = new FormData();
    body.append('file', file);
    const response = await apiFetch<{ url: string }>('/admin/uploads/image', {
      method: 'POST',
      body
    });
    form.coverImageUrl = response.url;
    notice.value = '封面圖已上傳';
  } catch (err) {
    error.value = err instanceof Error ? err.message : '上傳失敗';
  } finally {
    saving.value = false;
    input.value = '';
  }
}

async function eventAction(event: IzccEvent, action: string, label: string) {
  saving.value = true;
  error.value = '';
  notice.value = '';
  try {
    await apiFetch(`/admin/events/${event.id}/${action}`, { method: 'POST' });
    notice.value = label;
    await loadEvents();
  } catch (err) {
    error.value = err instanceof Error ? err.message : '操作失敗';
  } finally {
    saving.value = false;
  }
}

async function deleteEvent(event: IzccEvent) {
  if (!window.confirm(`刪除「${event.title}」？`)) return;
  saving.value = true;
  error.value = '';
  notice.value = '';
  try {
    await apiFetch(`/admin/events/${event.id}`, { method: 'DELETE' });
    notice.value = '活動已刪除';
    if (form.id === event.id) resetForm();
    await loadEvents();
  } catch (err) {
    error.value = err instanceof Error ? err.message : '刪除失敗';
  } finally {
    saving.value = false;
  }
}

async function showRegistrations(event: IzccEvent) {
  registrationEvent.value = event;
  registrations.value = await apiFetch<Registration[]>(
    `/admin/events/${event.id}/registrations`
  );
}

onMounted(loadEvents);
</script>

<template>
  <main class="page">
    <section class="section-head">
      <div>
        <p class="eyebrow">Admin Console</p>
        <h1>活動管理</h1>
      </div>
      <button class="button button-secondary" type="button" @click="resetForm">
        <FilePlus2 :size="18" />
        新增活動
      </button>
    </section>

    <p v-if="error" class="alert">{{ error }}</p>
    <p v-if="notice" class="alert success">{{ notice }}</p>

    <section class="admin-layout">
      <form class="panel form-grid" @submit.prevent="saveEvent">
        <h2>{{ form.id ? '修改活動' : '新增活動' }}</h2>

        <label class="field">
          <span>活動標題</span>
          <input v-model.trim="form.title" required maxlength="180" />
        </label>

        <label class="field">
          <span>封面圖</span>
          <input v-model.trim="form.coverImageUrl" placeholder="/uploads/example.jpg" />
        </label>

        <div class="form-actions">
          <label class="button button-secondary button-sm">
            <Upload :size="16" />
            上傳圖片
            <input hidden type="file" accept="image/*" @change="uploadCover" />
          </label>
        </div>

        <img
          v-if="form.coverImageUrl"
          class="event-cover"
          :src="form.coverImageUrl"
          alt="活動封面預覽"
        />

        <label class="field">
          <span>活動內容</span>
          <RichEditor v-model="form.content" />
        </label>

        <button class="button" type="submit" :disabled="saving">
          <Save :size="18" />
          儲存
        </button>
      </form>

      <div class="panel">
        <div class="section-head">
          <div>
            <p class="eyebrow">Events</p>
            <h2>全部活動</h2>
          </div>
        </div>

        <div v-if="loading" class="empty-state">正在讀取活動。</div>
        <div v-else class="event-table">
          <article v-for="event in events" :key="event.id" class="admin-event-row">
            <div>
              <h3>{{ event.title }}</h3>
              <div class="event-meta">
                <StatusBadge :status="event.status" :archived-at="event.archivedAt" />
                <span>
                  <UsersRound :size="15" />
                  {{ event.registrationCount }} 人
                </span>
              </div>
            </div>

            <div class="row-actions">
              <button class="icon-button" type="button" title="修改" @click="editEvent(event)">
                <Pencil :size="17" />
              </button>
              <button class="icon-button" type="button" title="查看報名者" @click="showRegistrations(event)">
                <UsersRound :size="17" />
              </button>
              <button
                v-if="event.status !== 'published' && !event.archivedAt"
                class="icon-button"
                type="button"
                title="發佈"
                @click="eventAction(event, 'publish', '活動已發佈')"
              >
                <Eye :size="17" />
              </button>
              <button
                v-if="event.status === 'published'"
                class="icon-button"
                type="button"
                title="下架"
                @click="eventAction(event, 'unpublish', '活動已下架')"
              >
                <EyeOff :size="17" />
              </button>
              <button
                v-if="!event.archivedAt"
                class="icon-button"
                type="button"
                title="封存"
                @click="eventAction(event, 'archive', '活動已封存')"
              >
                <ArchiveX :size="17" />
              </button>
              <button
                v-else
                class="icon-button"
                type="button"
                title="解封存"
                @click="eventAction(event, 'unarchive', '活動已解封存')"
              >
                <ArchiveRestore :size="17" />
              </button>
              <button
                class="icon-button"
                type="button"
                title="刪除"
                :disabled="event.registrationCount > 0"
                @click="deleteEvent(event)"
              >
                <Trash2 :size="17" />
              </button>
            </div>
          </article>
        </div>

        <div v-if="registrationEvent" class="panel" style="margin-top: 16px">
          <div class="section-head">
            <div>
              <p class="eyebrow">Registrations</p>
              <h2>{{ registrationEvent.title }}</h2>
            </div>
          </div>
          <div v-if="registrations.length" class="registration-list">
            <div v-for="item in registrations" :key="item.id" class="registration-item">
              <span>{{ item.user.displayName || item.user.account }}</span>
              <span class="muted">{{ item.user.email || item.user.account }}</span>
            </div>
          </div>
          <div v-else class="empty-state">目前沒有報名者。</div>
        </div>
      </div>
    </section>
  </main>
</template>

