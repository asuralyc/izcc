<script setup lang="ts">
import { computed, ref } from 'vue';
import { Check, Copy } from 'lucide-vue-next';

interface RequiredInput {
  key: string;
  label: string;
}

const props = defineProps<{
  code: string;
  language?: string;
  required?: RequiredInput[];
  values?: Record<string, string>;
}>();

const copied = ref(false);
const warning = ref('');

const missingInputs = computed(() =>
  (props.required ?? []).filter((item) => !props.values?.[item.key]?.trim())
);

async function writeClipboard(text: string) {
  if (navigator.clipboard && window.isSecureContext) {
    await navigator.clipboard.writeText(text);
    return;
  }

  const textarea = document.createElement('textarea');
  textarea.value = text;
  textarea.setAttribute('readonly', '');
  textarea.style.position = 'fixed';
  textarea.style.left = '-9999px';
  textarea.style.opacity = '0';
  document.body.appendChild(textarea);
  textarea.select();
  const copiedWithFallback = document.execCommand('copy');
  document.body.removeChild(textarea);

  if (!copiedWithFallback) {
    throw new Error('複製失敗，請手動選取指令');
  }
}

async function copyCode() {
  if (missingInputs.value.length > 0) {
    warning.value = `請先填寫：${missingInputs.value.map((item) => item.label).join('、')}`;
    copied.value = false;
    return;
  }

  try {
    await writeClipboard(props.code.trim());
    warning.value = '';
    copied.value = true;
    window.setTimeout(() => {
      copied.value = false;
    }, 1400);
  } catch (error) {
    warning.value = error instanceof Error ? error.message : '複製失敗，請手動選取指令';
    copied.value = false;
  }
}
</script>

<template>
  <div class="code-block">
    <button class="copy-button" type="button" @click="copyCode">
      <Check v-if="copied" :size="16" />
      <Copy v-else :size="16" />
      {{ copied ? '已複製' : '複製' }}
    </button>
    <pre><code :class="language ? `language-${language}` : undefined">{{ code.trim() }}</code></pre>
    <p v-if="warning" class="copy-warning">{{ warning }}</p>
  </div>
</template>
