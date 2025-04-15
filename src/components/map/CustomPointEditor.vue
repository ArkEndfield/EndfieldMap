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
      <div
        class="content"
        ref="contentRef"
      >
        <div
          v-for="(node, index) in nodes"
          :key="index"
          class="node"
          :class="{
            dragging: draggingIndex === index,
            placeholder: placeholderIndex === index && draggingIndex !== null,
          }"
          :style="{
            transform: `translateY(${getNodeTransform(index)}px)`,
            transition:
              draggingIndex === index ? 'none' : 'transform 0.2s ease',
          }"
        >
          <div
            class="drag-handle"
            @mousedown="startDrag(index, $event)"
          >
            <span class="drag-icon"><MenuIcon /></span>
          </div>
          <div class="node-content">
            <template v-if="node.type === 'text'">
              <textarea
                v-model="node.text"
                class="text-input"
                :placeholder="t('custom_point.text_placeholder')"
                rows="3"
              />
            </template>
            <template v-else-if="node.type === 'image'">
              <div class="image-wrapper">
                <ImageUploader v-model="node.src" />
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
import { ref, watch, onMounted, nextTick } from 'vue';
import { useI18n } from 'vue-i18n';
import { useMouse, useEventListener } from '@vueuse/core';
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
const nodes = ref<Array<GuideNode & { y: number }>>([]);
const draggingIndex = ref<number | null>(null);
const placeholderIndex = ref<number | null>(null);
const startY = ref(0);
const contentRef = ref<HTMLElement | null>(null);
const { y: mouseY } = useMouse();

// 初始化数据
onMounted(() => {
  if (props.initialNodes) {
    nodes.value = props.initialNodes.map(node => ({ ...node, y: 0 }));
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
      nodes.value = newValue.map(node => ({ ...node, y: 0 }));
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
    const nodesWithoutY = newValue.map(({ y, ...rest }) => rest);
    if (JSON.stringify(nodesWithoutY) !== JSON.stringify(props.initialNodes)) {
      emit('update:nodes', nodesWithoutY);
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
    y: 0,
  });
};

const addImageNode = () => {
  nodes.value.push({
    type: 'image',
    src: '',
    y: 0,
  });
};

const removeNode = (index: number) => {
  nodes.value.splice(index, 1);
};

const getNodeTransform = (index: number) => {
  if (draggingIndex.value === null) return 0;

  const currentIndex = draggingIndex.value;
  const targetIndex = placeholderIndex.value ?? currentIndex;

  if (index === currentIndex) {
    return nodes.value[index].y;
  }

  // 计算当前拖拽节点的位置
  const draggingNode = document.querySelectorAll('.node')[currentIndex];
  const draggingRect = draggingNode?.getBoundingClientRect();
  if (!draggingRect) return 0;

  // 计算节点间距
  const nodeGap = 0.75; // rem
  const nodeGapPx =
    parseFloat(getComputedStyle(document.documentElement).fontSize) * nodeGap;

  if (currentIndex < targetIndex) {
    // 向下拖拽
    if (index > currentIndex && index <= targetIndex) {
      // 计算需要移动的距离
      const moveDistance = draggingRect.height + nodeGapPx;
      return -moveDistance;
    }
  } else if (currentIndex > targetIndex) {
    // 向上拖拽
    if (index >= targetIndex && index < currentIndex) {
      // 计算需要移动的距离
      const moveDistance = draggingRect.height + nodeGapPx;
      return moveDistance;
    }
  }

  return 0;
};

const updatePlaceholder = (currentIndex: number, deltaY: number) => {
  const draggingNode = document.querySelectorAll('.node')[currentIndex];
  const draggingRect = draggingNode?.getBoundingClientRect();
  if (!draggingRect) return;

  // 计算节点间距
  const nodeGap = 0.75; // rem
  const nodeGapPx =
    parseFloat(getComputedStyle(document.documentElement).fontSize) * nodeGap;

  // 计算阈值（节点高度的一半加上间距）
  const threshold = (draggingRect.height + nodeGapPx) / 2;

  let newPlaceholderIndex = currentIndex;
  if (deltaY > threshold) {
    // 向下拖拽
    newPlaceholderIndex = Math.min(currentIndex + 1, nodes.value.length - 1);
  } else if (deltaY < -threshold) {
    // 向上拖拽
    newPlaceholderIndex = Math.max(currentIndex - 1, 0);
  }

  placeholderIndex.value = newPlaceholderIndex;

  // 自动滚动
  if (contentRef.value) {
    const contentRect = contentRef.value.getBoundingClientRect();

    if (draggingRect.bottom > contentRect.bottom) {
      contentRef.value.scrollTop +=
        draggingRect.bottom - contentRect.bottom + 20;
    } else if (draggingRect.top < contentRect.top) {
      contentRef.value.scrollTop -= contentRect.top - draggingRect.top + 20;
    }
  }
};

const startDrag = (index: number, event: MouseEvent) => {
  draggingIndex.value = index;
  startY.value = event.clientY;

  useEventListener('mousemove', handleDrag);
  useEventListener('mouseup', stopDrag);
};

const handleDrag = () => {
  if (draggingIndex.value !== null) {
    const deltaY = mouseY.value - startY.value;
    nodes.value[draggingIndex.value].y = deltaY;
    updatePlaceholder(draggingIndex.value, deltaY);
  }
};

const stopDrag = async () => {
  if (draggingIndex.value !== null) {
    const currentIndex = draggingIndex.value;
    const newIndex = placeholderIndex.value ?? currentIndex;

    // 禁用所有过渡效果
    const nodeElements = document.querySelectorAll('.node');
    nodeElements.forEach(node => {
      (node as HTMLElement).style.transition = 'none';
    });

    if (newIndex !== currentIndex) {
      // 先更新节点顺序
      const node = nodes.value.splice(currentIndex, 1)[0];
      nodes.value.splice(newIndex, 0, node);

      // 等待 DOM 更新
      await nextTick();

      // 然后重置所有节点的位置
      nodes.value.forEach(node => {
        node.y = 0;
      });
    } else {
      // 如果没有改变位置，直接重置位置
      nodes.value[currentIndex].y = 0;
    }

    // 在下一帧恢复过渡效果
    requestAnimationFrame(() => {
      nodeElements.forEach(node => {
        (node as HTMLElement).style.transition = '';
      });
    });

    draggingIndex.value = null;
    placeholderIndex.value = null;
  }
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
  max-height: 60vh;
  padding: 1rem;
  background-color: #2d2d2d;
  border: 1px solid #404040;
  border-radius: 0.375rem;
  position: relative;
  overflow-y: auto;
  overflow-x: hidden;
}

.node {
  display: flex;
  align-items: flex-start;
  margin-bottom: 0.75rem;
  background-color: #1a1a1a;
  border-radius: 0.375rem;
  padding: 0.5rem;
  position: relative;
  z-index: 1;
  touch-action: none;
  will-change: transform;
  transition: transform 0.2s ease;

  &:hover {
    z-index: 2;
  }

  &.dragging {
    transition: none;
    z-index: 3;
    box-shadow: 0 0 15px rgba(236, 224, 101, 0.4);
    background-color: #333333;
    opacity: 0.8;
  }

  &.placeholder {
    background-color: #333333;
    border: 2px dashed #ece065;
    opacity: 0.5;
  }
}

.drag-handle {
  display: flex;
  align-items: center;
  padding: 0.5rem;
  color: #666666;
  user-select: none;
  cursor: move;

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
