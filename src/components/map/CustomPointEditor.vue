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
        <ZmdButtonRight
          @click="addNodeNode"
          type="primary"
        >
          <template #icon>
            <FolderIcon />
          </template>
          {{ t('custom_point.add_node') }}
        </ZmdButtonRight>
      </div>
      <div
        class="content"
        ref="contentRef"
      >
        <VueDraggable
          v-model="nodes"
          :item-key="'id'"
          handle=".drag-handle"
          ghost-class="ghost"
          chosen-class="chosen"
          drag-class="dragging"
          :animation="150"
          @update="handleUpdate"
          class="content"
        >
          <template
            v-for="element in nodes"
            :key="element.id"
          >
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
                    @change="handleTextChange"
                  />
                </template>
                <template v-else-if="element.type === 'image'">
                  <div class="image-wrapper">
                    <ImageUploader
                      v-model="element.src"
                      @change="handleUpdate"
                    />
                  </div>
                </template>
                <template v-else-if="element.type === 'node'">
                  <div class="node-container">
                    <VueDraggable
                      v-model="element.nodes"
                      :item-key="'id'"
                      handle=".drag-handle"
                      ghost-class="ghost"
                      chosen-class="chosen"
                      drag-class="dragging"
                      :animation="150"
                      @update="handleUpdate"
                      class="node-content"
                    >
                      <template
                        v-for="childElement in element.nodes"
                        :key="childElement.id"
                      >
                        <div class="node">
                          <div class="drag-handle">
                            <span class="drag-icon"><MenuIcon /></span>
                          </div>
                          <div class="node-content">
                            <template v-if="childElement.type === 'text'">
                              <textarea
                                v-model="childElement.text"
                                class="text-input"
                                :placeholder="
                                  t('custom_point.text_placeholder')
                                "
                                rows="3"
                                @change="handleTextChange"
                              />
                            </template>
                            <template v-else-if="childElement.type === 'image'">
                              <div class="image-wrapper">
                                <ImageUploader
                                  v-model="childElement.src"
                                  @change="handleUpdate"
                                />
                              </div>
                            </template>
                          </div>
                          <button
                            @click="removeChildNode(element, childElement)"
                            class="remove-button"
                          >
                            <TrashIcon />
                          </button>
                        </div>
                      </template>
                    </VueDraggable>
                    <div class="node-toolbar">
                      <ZmdButtonRight @click="addChildTextNode(element)">
                        <template #icon>
                          <TextIcon />
                        </template>
                        {{ t('custom_point.add_text') }}
                      </ZmdButtonRight>
                      <ZmdButtonRight
                        @click="addChildImageNode(element)"
                        type="primary"
                      >
                        <template #icon>
                          <ImageIcon />
                        </template>
                        {{ t('custom_point.add_image') }}
                      </ZmdButtonRight>
                    </div>
                  </div>
                </template>
              </div>
              <button
                @click="removeNode(element)"
                class="remove-button"
              >
                <TrashIcon />
              </button>
            </div>
          </template>

          <div
            v-if="nodes.length === 0"
            class="empty"
          >
            {{ t('custom_point.empty_content') }}
          </div>
        </VueDraggable>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, onMounted } from 'vue';
import { useI18n } from 'vue-i18n';
import { VueDraggable } from 'vue-draggable-plus';
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

type NodeWithId = {
  id: string;
} & (
  | {
      type: 'text';
      text: string;
      color?: string;
      fontSize?: number;
      fontWeight?: number;
      fontFamily?: string;
    }
  | {
      type: 'image';
      src: string;
    }
  | {
      type: 'node';
      nodes: NodeWithId[];
    }
);

const nodes = ref<NodeWithId[]>([]);
const contentRef = ref<HTMLElement | null>(null);

// 初始化数据
onMounted(() => {
  if (props.initialNodes) {
    nodes.value = props.initialNodes.map(node => ({
      ...node,
      id: Math.random().toString(36).substr(2, 9),
      nodes:
        node.type === 'node'
          ? node.nodes.map(child => ({
              ...child,
              id: Math.random().toString(36).substr(2, 9),
            }))
          : [],
    })) as NodeWithId[];
  }
});

// 监听 props 的变化，更新本地状态
watch(
  () => props.initialNodes,
  newValue => {
    if (newValue) {
      const newNodes = newValue.map(node => ({
        ...node,
        id: Math.random().toString(36).substr(2, 9),
        nodes:
          node.type === 'node'
            ? node.nodes.map(child => ({
                ...child,
                id: Math.random().toString(36).substr(2, 9),
              }))
            : [],
      }));
      nodes.value = JSON.parse(JSON.stringify(newNodes)) as NodeWithId[];
    }
  },
  { deep: true }
);

// 监听本地状态的变化，触发更新事件
watch(type, newValue => {
  emit('update:type', newValue);
});

const typeOptions = Object.entries(customEntityInfo).map(([key, value]) => ({
  value: key,
  label: value.entityInfo.point,
  icon: `/assets/${value.category}/${value.entityInfo.pic}.png`,
}));

const addTextNode = () => {
  const newNode = {
    type: 'text',
    text: '',
    id: Math.random().toString(36).substr(2, 9),
  };
  nodes.value.push(JSON.parse(JSON.stringify(newNode)) as NodeWithId);
};

const addImageNode = () => {
  const newNode = {
    type: 'image',
    src: '',
    id: Math.random().toString(36).substr(2, 9),
  };
  nodes.value.push(JSON.parse(JSON.stringify(newNode)) as NodeWithId);
};

const addNodeNode = () => {
  const newNode = {
    type: 'node',
    nodes: [],
    id: Math.random().toString(36).substr(2, 9),
  };
  // 确保新节点是完全可序列化的
  const serializedNode = JSON.parse(JSON.stringify(newNode)) as NodeWithId;
  nodes.value.push(serializedNode);
};

const removeNode = (node: NodeWithId) => {
  const index = nodes.value.findIndex(n => n.id === node.id);
  if (index !== -1) {
    nodes.value.splice(index, 1);
    handleUpdate();
  }
};

const addChildTextNode = (parentNode: NodeWithId) => {
  if (parentNode.type === 'node') {
    const newNode = {
      type: 'text',
      text: '',
      id: Math.random().toString(36).substr(2, 9),
    };
    // 确保新节点是完全可序列化的
    const serializedNode = JSON.parse(JSON.stringify(newNode)) as NodeWithId;
    parentNode.nodes.push(serializedNode);
    handleUpdate();
  }
};

const addChildImageNode = (parentNode: NodeWithId) => {
  if (parentNode.type === 'node') {
    const newNode = {
      type: 'image',
      src: '',
      id: Math.random().toString(36).substr(2, 9),
    };
    // 确保新节点是完全可序列化的
    const serializedNode = JSON.parse(JSON.stringify(newNode)) as NodeWithId;
    parentNode.nodes.push(serializedNode);
    handleUpdate();
  }
};

const removeChildNode = (parentNode: NodeWithId, childNode: NodeWithId) => {
  if (parentNode.type === 'node') {
    const index = parentNode.nodes.findIndex(n => n.id === childNode.id);
    if (index !== -1) {
      parentNode.nodes.splice(index, 1);
      handleUpdate();
    }
  }
};

const handleTextChange = () => {
  handleUpdate();
};

const handleUpdate = () => {
  // 直接触发更新，不使用防抖
  const nodesWithoutId = nodes.value.map(({ id, ...rest }) => {
    const node = {
      ...rest,
      nodes:
        rest.type === 'node'
          ? rest.nodes.map(({ id, ...childRest }) => childRest)
          : [],
    };
    return node;
  });
  // 确保即使节点为空也触发更新
  emit('update:nodes', nodesWithoutId as GuideNode[]);
  // 如果节点为空，也触发一次更新
  if (nodes.value.length === 0) {
    emit('update:nodes', [] as GuideNode[]);
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
}

.content {
  min-height: 8rem;
  padding: 1rem;
  background-color: #2d2d2d;
  border: 1px solid #404040;
  border-radius: 0.375rem;
  position: relative;
  overflow: hidden;
}

.node {
  display: flex;
  align-items: flex-start;
  margin-bottom: 0.75rem;
  background-color: #1a1a1a;
  border-radius: 0.375rem;
  padding: 0.5rem;
  position: relative;
  touch-action: none;
  will-change: transform;
  transition: transform 0.2s ease;

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
  font-size: 1.5rem;
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
  pointer-events: auto;
  user-select: text;

  &:focus {
    outline: none;
    border-color: #ece065;
  }

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
  z-index: 3;
}

.chosen {
  background-color: #333333;
  z-index: 3;
}

.dragging {
  background-color: #333333;
  z-index: 3;
}

.node-container {
  width: 100%;
  padding: 0.5rem;
  background-color: #1a1a1a;
  border-radius: 0.375rem;
  border: 1px solid #404040;
  margin-bottom: 0.5rem;

  .node {
    background-color: #2d2d2d;

    &.dragging {
      background-color: #404040;
    }
  }
}

.node-toolbar {
  display: flex;
  gap: 0.5rem;
  margin-top: 0.75rem;
  justify-content: flex-start;
}
</style>
