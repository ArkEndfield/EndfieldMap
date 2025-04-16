<template>
  <div
    class="image-uploader"
    :class="{ 'is-dragging': isDragging }"
    @dragenter.prevent="handleDragEnter"
    @dragover.prevent="handleDragOver"
    @dragleave.prevent="handleDragLeave"
    @drop.prevent="handleDrop"
    @click="handleClick"
  >
    <input
      ref="fileInput"
      type="file"
      accept="image/*"
      class="hidden"
      @change="handleFileChange"
    />
    <div
      v-if="!previewUrl"
      class="upload-area"
    >
      <div class="upload-icon">
        <i class="fas fa-cloud-upload-alt"></i>
      </div>
      <div class="upload-text">
        {{ t('image_uploader.drag_drop') }}
        <br />
        {{ t('image_uploader.or_click') }}
      </div>
    </div>
    <div
      v-else
      class="preview-container"
    >
      <img
        :src="previewUrl"
        class="preview-image"
      />
      <button
        class="remove-btn"
        @click.stop="handleRemove"
      >
        <i class="fas fa-times"></i>
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue';
import { useI18n } from 'vue-i18n';

const { t } = useI18n();

const props = defineProps<{
  modelValue?: string;
}>();

const emit = defineEmits<{
  (e: 'update:modelValue', value: string): void;
  (e: 'change', value: string): void;
}>();

const fileInput = ref<HTMLInputElement | null>(null);
const isDragging = ref(false);
const previewUrl = ref(props.modelValue || '');

// 监听 modelValue 的变化
watch(
  () => props.modelValue,
  newValue => {
    previewUrl.value = newValue || '';
  }
);

const handleDragEnter = () => {
  isDragging.value = true;
};

const handleDragOver = () => {
  isDragging.value = true;
};

const handleDragLeave = () => {
  isDragging.value = false;
};

const handleDrop = (e: DragEvent) => {
  isDragging.value = false;
  const files = e.dataTransfer?.files;
  if (files && files.length > 0) {
    handleFile(files[0]);
  }
};

const handleClick = () => {
  fileInput.value?.click();
};

const handleFileChange = (e: Event) => {
  const input = e.target as HTMLInputElement;
  const files = input.files;
  if (files && files.length > 0) {
    handleFile(files[0]);
  }
};

const handleFile = (file: File) => {
  if (!file.type.startsWith('image/')) {
    return;
  }

  const reader = new FileReader();
  reader.onload = e => {
    const base64 = e.target?.result as string;
    previewUrl.value = base64;
    emit('update:modelValue', base64);
    emit('change', base64);
  };
  reader.readAsDataURL(file);
};

const handleRemove = () => {
  previewUrl.value = '';
  emit('update:modelValue', '');
  emit('change', '');
};
</script>

<style lang="scss" scoped>
.image-uploader {
  position: relative;
  border: 2px dashed #d1d5db;
  border-radius: 0.5rem;
  padding: 1rem;
  transition: all 0.2s;
  min-height: 200px;

  &.is-dragging {
    border-color: #3b82f6;
    background-color: #eff6ff;
  }

  .upload-area {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    height: 100%;
  }

  .upload-icon {
    font-size: 2.25rem;
    color: #9ca3af;
    margin-bottom: 0.5rem;
  }

  .upload-text {
    color: #6b7280;
    text-align: center;
  }

  .preview-container {
    position: relative;
    width: 100%;
    height: 100%;
  }

  .preview-image {
    max-width: 100%;
    max-height: 300px;
    object-fit: contain;
    margin: 0 auto;
  }

  .remove-btn {
    position: absolute;
    top: 0.5rem;
    right: 0.5rem;
    width: 2rem;
    height: 2rem;
    background-color: #ef4444;
    color: white;
    border-radius: 9999px;
    display: flex;
    align-items: center;
    justify-content: center;

    &:hover {
      background-color: #dc2626;
    }
  }
}
</style>
