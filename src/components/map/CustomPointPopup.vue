<template>
  <div class="custom-point-popup">
    <div class="content">
      <div class="-mt-1 px-4 flex gap-2 pr-14">
        <div class="w-8 h-8">
          <img
            :src="`/assets/custom/${entityInfo.entityInfo.pic}.png`"
            class="w-full h-full object-contain"
          />
        </div>
        <ZmdButtonRight
          @click="startEditing"
          size="small"
          class-name="shrink-0"
          reverse
          type="primary"
        >
          <template #icon>
            <EditIcon />
          </template>
          {{ t('custom_point.edit') }}
        </ZmdButtonRight>
        <ZmdButtonRight
          v-if="canConnectPole"
          @click="startConnectionMode"
          size="small"
          class-name="shrink-0"
          reverse
          type="primary"
        >
          <template #icon>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M12 2L13.09 8.26L19 9L13.09 9.74L12 16L10.91 9.74L5 9L10.91 8.26L12 2Z" fill="currentColor"/>
              <path d="M19 15L17.5 16.5L15 14L19 15Z" fill="currentColor"/>
              <path d="M5 15L6.5 16.5L9 14L5 15Z" fill="currentColor"/>
            </svg>
          </template>
          {{ t('custom_point.connect') }}
        </ZmdButtonRight>
      </div>
      <ScrollArea
        class="node-item mt-2 text-sm min-h-28 max-h-52 px-4"
        flex-container
        v-if="nodes && nodes.length > 0"
      >
        <GuideNode :nodes="nodes" />
      </ScrollArea>
      <div
        v-else
        class="text-center text-sm mt-4 px-4"
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
        :initial-type="point?.entityDataIdKey || 'custom'"
        :initial-nodes="editingNodes"
        @update:nodes="handleNodesUpdate"
      />
    </ZmdAlert>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import CustomPointEditor from '@/components/map/CustomPointEditor.vue';
import {
  updateCustomPoint,
  getCustomPointData,
  saveCustomPointData,
} from '@/services/customPoints';
import type { PointData, CustomPointData } from '@/types/points';
import type { GuideNode as GuideNodeType, NodeType } from '@/types/guides';
import { customPointTypes, entityInfo as entityInfoData } from '@/data/entity';
import { computed } from 'vue';
import { CustomPointKey } from '@/types/customPoints';
import { closePopup } from '@/services/map';
import { startConnectionMode as startPoleConnectionMode, getPoleConnections, MAX_CONNECTIONS_PER_POLE } from '@/services/electricPoleConnector';
const { t } = useI18n();

const props = defineProps<{
  point: PointData | null;
}>();

const isEditing = ref(false);
const editingType = ref(customPointTypes[0]);
const editingNodes = ref<GuideNodeType[]>([]);
const nodes = ref<NodeType[]>([]);

const entityInfo = computed(() => {
  return entityInfoData[props.point?.entityDataIdKey || customPointTypes[0]];
});

const isElectricPole = computed(() => {
  return props.point?.entityDataIdKey === 'electric_pole';
});

const canConnectPole = computed(() => {
  if (!isElectricPole.value || !props.point) {
    return false;
  }

  // 检查连接数量是否未达到上限
  const connectionCount = getPoleConnections(props.point);
  return connectionCount < MAX_CONNECTIONS_PER_POLE;
});
// 处理节点更新
const handleNodesUpdate = (newNodes: GuideNodeType[]) => {
  // 只有在数据真正变化时才更新
  if (JSON.stringify(newNodes) !== JSON.stringify(editingNodes.value)) {
    editingNodes.value = JSON.parse(JSON.stringify(newNodes));
  }
};

// 加载标点数据的函数
const loadPointData = async () => {
  if (props.point?.levelLogicId) {
    const data = await getCustomPointData(props.point.levelLogicId.toString());
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

// 监听 point 变化
watch(
  () => props.point?.levelLogicId,
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
  editingType.value = (props.point?.entityDataIdKey ||
    customPointTypes[0]) as CustomPointKey;
  isEditing.value = true;
};

const handleSave = async () => {
  if (props.point?.levelLogicId) {
    const customPointData: CustomPointData = {
      nodes:
        editingNodes.value.length > 0
          ? [
              {
                type: 'node' as const,
                nodes: editingNodes.value,
              },
            ]
          : [],
    };

    await updateCustomPoint(props.point.levelLogicId.toString(), {
      entityDataIdKey: editingType.value,
    });
    await saveCustomPointData(
      props.point.levelLogicId.toString(),
      customPointData
    );
    nodes.value = customPointData.nodes;
    isEditing.value = false;
  }
};

const handleClose = () => {
  isEditing.value = false;
  // 重置编辑状态
  if (props.point?.levelLogicId) {
    loadPointData();
  }
};

const startConnectionMode = () => {
  // 关闭弹窗并开始连线模式
  closePopup();
  if (props.point) {
    startPoleConnectionMode(props.point);
  }
};
</script>

<style lang="scss" scoped></style>
