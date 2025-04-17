<template>
  <div class="custom-point-popup">
    <div class="content">
      <div class="-mt-1">
        <ZmdButtonRight
          @click="startEditing"
          size="small"
          class-name="!w-28"
          reverse
          type="primary"
        >
          <template #icon>
            <EditIcon />
          </template>
          {{ t('custom_point.edit') }}
        </ZmdButtonRight>
      </div>
      <ScrollArea
        v-for="(node, index) in nodes"
        :key="index"
        class="node-item mt-2 text-sm min-h-28 max-h-52"
        flex-container
        v-if="nodes && nodes.length > 0"
      >
        <GuideNodeNode :node="node" />
      </ScrollArea>
      <div
        v-else
        class="text-center text-sm mt-4"
      >
        {{ t('no_data') }}
      </div>
    </div>
    <ZmdAlert
      v-model:open="isEditing"
      @cancel="handleClose"
      @confirm="handleSave"
      width="800px"
      height="95vh"
    >
      <div class="text-2xl text-center mb-2 font-bold">
        {{ t('custom_point.edit_title') }}
      </div>
      <CustomPointEditor
        v-model:type="editingType"
        v-model:nodes="editingNodes"
        :initial-type="entity?.entityDataIdKey || 'custom'"
        :initial-nodes="editingNodes"
        @update:nodes="handleNodesUpdate"
      />
    </ZmdAlert>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import CustomPointEditor from './CustomPointEditor.vue';
import GuideNodeNode from '@/components/GuideNodes/GuideNodeNode.vue';
import {
  updateCustomPoint,
  getCustomPointData,
  saveCustomPointData,
} from '@/services/customPoints';
import type { PointData, CustomPointData } from '@/types/points';
import type { GuideNode as GuideNodeType, NodeType } from '@/types/guides';

const { t } = useI18n();

const props = defineProps<{
  entity: PointData | null;
}>();

const isEditing = ref(false);
const editingType = ref('custom');
const editingNodes = ref<GuideNodeType[]>([]);
const nodes = ref<NodeType[]>([]);

// 处理节点更新
const handleNodesUpdate = (newNodes: GuideNodeType[]) => {
  // 只有在数据真正变化时才更新
  if (JSON.stringify(newNodes) !== JSON.stringify(editingNodes.value)) {
    editingNodes.value = JSON.parse(JSON.stringify(newNodes));
  }
};

// 加载标点数据的函数
const loadPointData = async () => {
  if (props.entity?.levelLogicId) {
    const data = await getCustomPointData(props.entity.levelLogicId.toString());
    console.log('Loaded point data:', data);
    if (data) {
      nodes.value = data.nodes;
      editingNodes.value = data.nodes.flatMap(node =>
        node.type === 'node' ? node.nodes : []
      ) as GuideNodeType[];
      console.log('Set editing nodes:', editingNodes.value);
    } else {
      nodes.value = [];
      editingNodes.value = [];
    }
  }
};

// 监听 entity 变化
watch(
  () => props.entity?.levelLogicId,
  newId => {
    if (newId) {
      loadPointData();
    }
  }
);

onMounted(() => {
  loadPointData();
});

const startEditing = () => {
  editingType.value = props.entity?.entityDataIdKey || 'custom';
  isEditing.value = true;
};

const handleSave = async () => {
  if (props.entity?.levelLogicId) {
    const customPointData: CustomPointData = {
      nodes: [
        {
          type: 'node' as const,
          nodes: editingNodes.value,
        },
      ],
    };

    await updateCustomPoint(props.entity.levelLogicId.toString(), {
      entityDataIdKey: editingType.value,
    });
    await saveCustomPointData(
      props.entity.levelLogicId.toString(),
      customPointData
    );
    nodes.value = customPointData.nodes;
    isEditing.value = false;
  }
};

const handleClose = () => {
  isEditing.value = false;
  // 重置编辑状态
  if (props.entity?.levelLogicId) {
    loadPointData();
  }
};
</script>

<style lang="scss" scoped></style>
