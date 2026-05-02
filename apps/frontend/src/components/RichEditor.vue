<script setup lang="ts">
import { nextTick, ref, watch } from 'vue';
import { Bold, Heading2, Italic, Link, List, ListOrdered } from 'lucide-vue-next';

const model = defineModel<string>({ default: '' });
const editor = ref<HTMLElement | null>(null);
let syncingFromModel = false;

watch(
  model,
  async (value) => {
    if (editor.value && editor.value.innerHTML !== value) {
      syncingFromModel = true;
      await nextTick();
      editor.value.innerHTML = value || '';
      syncingFromModel = false;
    }
  },
  { immediate: true }
);

function emitContent() {
  if (syncingFromModel) return;
  model.value = editor.value?.innerHTML ?? '';
}

function command(name: string, value?: string) {
  editor.value?.focus();
  document.execCommand(name, false, value);
  emitContent();
}

function insertLink() {
  const url = window.prompt('連結網址');
  if (!url) return;
  command('createLink', url);
}
</script>

<template>
  <div class="editor-shell">
    <div class="editor-toolbar" aria-label="內容編輯器工具列">
      <button class="icon-button" type="button" title="標題" @click="command('formatBlock', 'h2')">
        <Heading2 :size="18" />
      </button>
      <button class="icon-button" type="button" title="粗體" @click="command('bold')">
        <Bold :size="18" />
      </button>
      <button class="icon-button" type="button" title="斜體" @click="command('italic')">
        <Italic :size="18" />
      </button>
      <button class="icon-button" type="button" title="項目清單" @click="command('insertUnorderedList')">
        <List :size="18" />
      </button>
      <button class="icon-button" type="button" title="編號清單" @click="command('insertOrderedList')">
        <ListOrdered :size="18" />
      </button>
      <button class="icon-button" type="button" title="連結" @click="insertLink">
        <Link :size="18" />
      </button>
    </div>
    <div
      ref="editor"
      class="editor-canvas content-body"
      contenteditable="true"
      @input="emitContent"
      @blur="emitContent"
    ></div>
  </div>
</template>

