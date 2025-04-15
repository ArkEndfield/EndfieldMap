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
      <div
        v-for="(node, index) in nodes"
        :key="index"
        class="node-item mt-2 text-sm min-h-12"
        v-if="nodes && nodes.length > 0"
      >
        <GuideNodeNode :node="node" />
      </div>
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
      />
    </ZmdAlert>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import ZmdAlert from '@/components/ZmdAlert/index.vue';
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

// 加载标点数据的函数
const loadPointData = async () => {
  if (props.entity?.levelLogicId) {
    const data = await getCustomPointData(props.entity.levelLogicId.toString());
    console.log('Loaded point data:', data);
    if (data) {
      nodes.value = data.nodes.map(node => ({
        type: 'node' as const,
        nodes: node.nodes.filter(
          (n): n is GuideNodeType => n.type === 'text' || n.type === 'image'
        ),
      }));
      editingNodes.value = nodes.value.flatMap(
        node => node.nodes
      ) as GuideNodeType[];
      console.log('Set editing nodes:', editingNodes.value);
    } else {
      // 如果没有数据，初始化为空数组
      nodes.value = [];
      editingNodes.value = [];
    }
  }
};

// 监听 entity 变化
watch(
  () => props.entity?.levelLogicId,
  () => {
    loadPointData();
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
    // 确保数据可以被序列化
    const serializedNodes = editingNodes.value.map(node => {
      if (node.type === 'text') {
        return {
          type: 'text' as const,
          text: node.text || '',
        };
      } else if (node.type === 'image') {
        return {
          type: 'image' as const,
          src: node.src || '',
        };
      }
      return node;
    });

    const customPointData: CustomPointData = {
      nodes: [
        {
          type: 'node' as const,
          nodes: serializedNodes,
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
