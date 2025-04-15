<template>
  <div class="editor">
    <div class="section">
      <div class="title">
        <LocationClusterIcon />
        {{ t('custom_point.type') }}
      </div>
      <CustomSelect
        v-model="type"
        :options="typeOptions"
      />
    </div>

    <div class="section">
      <div class="title">
        <FeedbackIcon />
        {{ t('custom_point.content') }}
      </div>
      <div class="toolbar">
        <ZmdButtonRight @click="addTextNode">
          <template #icon>
            <TextIcon />
          </template>
          {{ t('custom_point.add_text') }}
        </ZmdButtonRight>
        <ZmdButtonRight
          @click="addImageNode"
          type="primary"
        >
          <template #icon>
            <ImageIcon />
          </template>
          {{ t('custom_point.add_image') }}
        </ZmdButtonRight>
      </div>
      <div class="content">
        <draggable
          v-model="nodes"
          item-key="index"
          handle=".drag-handle"
          @end="onDragEnd"
          :animation="300"
          ghost-class="ghost"
          chosen-class="chosen"
          drag-class="dragging"
          :force-fallback="true"
          :fallback-class="true"
          :fallback-on-body="true"
          :fallback-tolerance="0"
        >
          <template #item="{ element, index }">
            <div class="node">
              <div class="drag-handle">
                <span class="drag-icon"><MenuIcon /></span>
              </div>
              <div class="node-content">
                <template v-if="element.type === 'text'">
                  <textarea
                    v-model="element.text"
                    class="text-input"
                    :placeholder="t('custom_point.text_placeholder')"
                    rows="3"
                  />
                </template>
                <template v-else-if="element.type === 'image'">
                  <div class="image-wrapper">
                    <ImageUploader v-model="element.src" />
                  </div>
                </template>
              </div>
              <button
                @click="removeNode(index)"
                class="remove-button"
              >
                <TrashIcon />
              </button>
            </div>
          </template>
        </draggable>
        <div
          v-if="nodes.length === 0"
          class="empty"
        >
          {{ t('custom_point.empty_content') }}
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, onMounted } from 'vue';
import { useI18n } from 'vue-i18n';
import draggable from 'vuedraggable';
import CustomSelect from '@/components/common/CustomSelect.vue';
import ImageUploader from '@/components/common/ImageUploader.vue';
import type { GuideNode } from '@/types/guides';
import { customEntityInfo } from '@/data/entity';

const { t } = useI18n();

const props = defineProps<{
  initialType: string;
  initialNodes?: GuideNode[];
}>();

const emit = defineEmits<{
  (e: 'update:type', value: string): void;
  (e: 'update:nodes', value: GuideNode[]): void;
}>();

const type = ref(props.initialType);
const nodes = ref<GuideNode[]>([]);

// 初始化数据
onMounted(() => {
  if (props.initialNodes) {
    nodes.value = [...props.initialNodes];
  }
});

// 监听 props 的变化，更新本地状态
watch(
  () => props.initialType,
  newValue => {
    if (newValue !== type.value) {
      type.value = newValue;
    }
  }
);

watch(
  () => props.initialNodes,
  newValue => {
    if (newValue && JSON.stringify(newValue) !== JSON.stringify(nodes.value)) {
      nodes.value = [...newValue];
    }
  },
  { deep: true }
);

// 监听本地状态的变化，触发更新事件
watch(type, newValue => {
  if (newValue !== props.initialType) {
    emit('update:type', newValue);
  }
});

watch(
  nodes,
  newValue => {
    if (JSON.stringify(newValue) !== JSON.stringify(props.initialNodes)) {
      emit('update:nodes', newValue);
    }
  },
  { deep: true }
);

const typeOptions = Object.entries(customEntityInfo).map(([key, value]) => ({
  value: key,
  label: value.entityInfo.name,
  icon: `/assets/${value.category}/${value.entityInfo.pic}.png`,
}));

const addTextNode = () => {
  nodes.value.push({
    type: 'text',
    text: '',
  });
};

const addImageNode = () => {
  nodes.value.push({
    type: 'image',
    src: '',
  });
};

const removeNode = (index: number) => {
  nodes.value.splice(index, 1);
};

const onDragEnd = (): void => {
  emit('update:nodes', nodes.value);
};
</script>

<style lang="scss" scoped>
.editor {
  padding: 1rem;
  color: #e5e5e5;
}

.section {
  margin-bottom: 2rem;
  position: relative;

  &:not(:last-child)::after {
    content: '';
    position: absolute;
    bottom: -1.5rem;
    left: 0;
    right: 0;
    height: 1px;
    background: linear-gradient(90deg, transparent, #2a2728, transparent);
  }
}

.title {
  display: flex;
  align-items: center;
  color: #2a2728;
  font-size: 1.25rem;
  font-weight: 500;
  margin-bottom: 0.75rem;
  gap: 0.5rem;
}

.icon {
  color: #2a2728;
}

.toolbar {
  display: flex;
  gap: 0.5rem;
  margin-bottom: 0.75rem;
  margin-left: auto;
  justify-content: flex-start;
  max-width: 100%;
  width: 20em;
}

.content {
  min-height: 8rem;
  padding: 1rem;
  background-color: #2d2d2d;
  border: 1px solid #404040;
  border-radius: 0.375rem;
  position: relative;
  overflow: visible;
}

.node {
  display: flex;
  align-items: flex-start;
  margin-bottom: 0.75rem;
  background-color: #1a1a1a;
  border-radius: 0.375rem;
  padding: 0.5rem;
  transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1),
    background-color 0.2s ease, box-shadow 0.2s ease;
  transform-origin: center;
  position: relative;
  z-index: 1;

  &:hover {
    z-index: 2;
  }
}

.drag-handle {
  display: flex;
  align-items: center;
  padding: 0.5rem;
  color: #666666;
  user-select: none;

  &:hover {
    color: #ece065;
  }
}

.drag-icon {
  font-size: 2rem;
}

.node-content {
  flex: 1;
}

.text-input {
  width: 100%;
  padding: 0.5rem;
  background-color: #1a1a1a;
  color: #e5e5e5;
  border: 1px solid #404040;
  border-radius: 0.375rem;
  resize: none;

  &::placeholder {
    color: #666666;
  }
}

.image-wrapper {
  width: 100%;
}

.remove-button {
  margin-left: 0.5rem;
  padding: 0.5rem;
  color: #ff6b6b;
  font-size: 1.3rem;
  &:hover {
    color: #ff5252;
  }
}

.empty {
  color: #666666;
  text-align: center;
}

.ghost {
  opacity: 0.5;
  background-color: #333333;
  transform: scale(1.02);
  z-index: 3;
  box-shadow: 0 0 10px rgba(236, 224, 101, 0.3);
}

.chosen {
  background-color: #333333;
  box-shadow: 0 0 10px rgba(236, 224, 101, 0.3);
  z-index: 3;
}

.dragging {
  background-color: #333333;
  box-shadow: 0 0 15px rgba(236, 224, 101, 0.4);
  transform: scale(1.02);
  z-index: 3;
}

// 移除之前的 sortable 相关类，使用 vuedraggable 默认的类名
.flip-list-move {
  transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.flip-list-enter-active,
.flip-list-leave-active {
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.flip-list-enter-from,
.flip-list-leave-to {
  opacity: 0;
  transform: translateY(30px);
}
</style>
