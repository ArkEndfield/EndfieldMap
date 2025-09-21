<template>
  <div class="map-container">
    <div
      id="map"
      class="absolute top-0 left-0 right-0 bottom-0 bg-cover bg-center"
      @contextmenu="onContextMenu"
    ></div>

    <MapControls
      :map="map as Map"
      v-model:zoomLevel="zoomLevel"
      ref="mapControlsRef"
    />

    <MapPopup
      :point="point"
      ref="mapPopupRef"
    />

    <MultiOperateMenus />

    <ContextMenu
      v-model="menuVisible"
      ref="contextMenuRef"
    >
      <ContextMenuItem
        :label="
          isPointMarked
            ? t('context_menu.mark_unobtained')
            : t('context_menu.mark_obtained')
        "
        v-show="!!rightClickPoint"
        @click="mark"
      >
        <template #icon>
          <CheckCircleIcon />
        </template>
      </ContextMenuItem>
      <ContextMenuItem
        :label="t('context_menu.create_point')"
        @click="() => handleAction(ACTION.CREATE)"
        :disabled="!!rightClickCustomPoint || !rightClickCoordinates"
      >
        <template #icon>
          <LocationClusterIcon />
        </template>
      </ContextMenuItem>
      <ContextMenuItem
        :label="t('context_menu.create_electric_pole')"
        @click="() => handleAction(ACTION.CREATE_ELECTRIC_POLE)"
        :disabled="!!rightClickCustomPoint || !rightClickCoordinates"
      >
        <template #icon>
          <LocationClusterIcon />
        </template>
      </ContextMenuItem>
      <ContextMenuItem
        :label="t('context_menu.connect_poles')"
        v-show="canConnectPole"
        @click="() => handleAction(ACTION.CONNECT_POLES)"
      >
        <template #icon>
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z"/>
          </svg>
        </template>
      </ContextMenuItem>
      <ContextMenuItem
        :label="t('context_menu.delete_connection')"
        v-show="!!rightClickLineGroupId"
        @click="() => handleAction(ACTION.DELETE_CONNECTION)"
        className="text-red-500"
      >
        <template #icon>
          <TrashIcon />
        </template>
      </ContextMenuItem>
      <ContextMenuItem
        :label="t('context_menu.delete_point')"
        v-show="!!rightClickCustomPoint"
        @click="() => handleAction(ACTION.DELETE)"
        className="text-red-500"
      >
        <template #icon>
          <TrashIcon />
        </template>
      </ContextMenuItem>
    </ContextMenu>
    <TourAlert />

    <ZmdAlert
      v-model:open="alertConfig.show"
      hide-cancel
    >
      <div class="text-center" v-if="alertConfig.content">
        {{ alertConfig.useI18n ? t(alertConfig.content) : alertConfig.content }}
      </div>
    </ZmdAlert>
  </div>
</template>

<script setup lang="ts">
import { onMounted, onBeforeUnmount, provide } from 'vue';
import {
  cacheMapId,
  createMap,
  map,
  cleanupMap,
  point,
  zoomLevel,
  popupManager,
  getCurrentMapId,
  addMapContextMenuListener,
} from './services/map';
import { Map } from 'ol';
import MapControls from './components/map/MapControls.vue';
import MapPopup, { MapPopupRef } from './components/map/MapPopup.vue';
import { ref } from 'vue';
import { ContextMenuRef } from './components/ContextMenu/type';
import type { Coordinate } from 'ol/coordinate';
import {
  createCustomPoint,
  deleteCustomPoint,
  isCustomPoint,
} from './services/customPoints';
import type { PointData } from './types/points';
import { computed } from 'vue';
import { isMarked, markPoint } from './services/marks';
import { useI18n } from 'vue-i18n';
import { removeConnection, startConnectionMode, getPoleConnections, MAX_CONNECTIONS_PER_POLE } from './services/electricPoleConnector'; // connectToPole 用于未来可能的直接调用
import ZmdAlert from './components/ZmdAlert/ZmdAlert.vue';
import { EVENTS, pubsub } from './services/pubsub';
const menuVisible = ref(false);
const alertConfig = ref({
  show: false,
  useI18n: false,
  content: '',
});
const contextMenuRef = ref<ContextMenuRef>();
// 引用DOM元素
const mapControlsRef = ref();
const mapPopupRef = ref<MapPopupRef>();
const rightClickCoordinates = ref<Coordinate>([0, 0]);
const rightClickCustomPoint = ref<PointData | null>(null);
const rightClickPoint = ref<PointData | null>(null);
const rightClickLineGroupId = ref<string | null>(null);
const { t } = useI18n();
// 提供弹出层管理器给子组件 - 在setup顶层调用provide
provide('popupManager', popupManager);

enum ACTION {
  CREATE = 'create',
  CREATE_ELECTRIC_POLE = 'create_electric_pole',
  CONNECT_POLES = 'connect_poles',
  DELETE_CONNECTION = 'delete_connection',
  DELETE = 'delete',
}

const isPointMarked = computed(() => {
  if (rightClickPoint.value) {
    return isMarked(rightClickPoint.value.levelLogicId);
  }
  return false;
});

const isElectricPole = computed(() => {
  return rightClickCustomPoint.value?.entityDataIdKey === 'electric_pole';
});

const canConnectPole = computed(() => {
  if (!isElectricPole.value || !rightClickCustomPoint.value) {
    return false;
  }

  // 检查连接数量是否未达到上限
  const connectionCount = getPoleConnections(rightClickCustomPoint.value);
  return connectionCount < MAX_CONNECTIONS_PER_POLE;
});

const onContextMenu = (event: MouseEvent) => {
  if (contextMenuRef.value) {
    contextMenuRef.value.showMenu(event);
  }
};

const handleAction = (action: string) => {
  console.log(`执行操作: ${action}`);
  menuVisible.value = false;
  const currentMap = getCurrentMapId();
  if (action === ACTION.CREATE) {
    createCustomPoint(rightClickCoordinates.value, currentMap);
  } else if (action === ACTION.CREATE_ELECTRIC_POLE) {
    createCustomPoint(rightClickCoordinates.value, currentMap, 'electric_pole');
  } else if (action === ACTION.CONNECT_POLES) {
    // 处理连接电线杆的逻辑
    if (rightClickCustomPoint.value) {
      startConnectionMode(rightClickCustomPoint.value);
      console.log('开始连接电线杆模式:', rightClickCustomPoint.value.levelLogicId);
    }
  } else if (action === ACTION.DELETE_CONNECTION) {
    // 处理删除连线的逻辑
    if (rightClickLineGroupId.value) {
      removeConnection(rightClickLineGroupId.value).then(success => {
        if (success) {
          console.log('成功删除连线:', rightClickLineGroupId.value);
        } else {
          console.log('删除连线失败:', rightClickLineGroupId.value);
        }
      });
      rightClickLineGroupId.value = null;
    }
  } else if (action === ACTION.DELETE) {
    // 处理删除坐标的逻辑
    if (rightClickCustomPoint.value?.levelLogicId) {
      deleteCustomPoint(rightClickCustomPoint.value.levelLogicId);
      rightClickCustomPoint.value = null;
      rightClickPoint.value = null;
    }
  }
};

const mark = () => {
  if (rightClickPoint.value) {
    markPoint(rightClickPoint.value.levelLogicId);
  }
};

onMounted(async () => {
  await createMap(
    cacheMapId.value,
    mapControlsRef.value.controls,
    mapPopupRef.value?.getPopupContainer()
  );
  addMapContextMenuListener((_event: MouseEvent, coordinate?: Coordinate, point?: PointData, lineGroupId?: string) => {
    rightClickCoordinates.value = coordinate as Coordinate;
    rightClickLineGroupId.value = lineGroupId || null;

    if (point && isCustomPoint(point)) {
      rightClickCustomPoint.value = point;
    } else if (point) {
      rightClickPoint.value = point;
    } else {
      rightClickCustomPoint.value = null;
      rightClickPoint.value = null;
    }
  });

  // 监听连接尝试开始事件
  pubsub.subscribe(EVENTS.CONNECTION_ATTEMPT_START, () => {
    // 开始新的连接尝试时，隐藏之前的失败弹窗
    alertConfig.value.show = false;
    alertConfig.value.content = '';
  });

  // 监听连接失败事件
  pubsub.subscribe(EVENTS.SHOW_ALERT, (data) => {
    alertConfig.value.content = data.content;
    alertConfig.value.useI18n = !!data.useI18n;
    alertConfig.value.show = true;
  });

  // 监听连接成功事件
  pubsub.subscribe(EVENTS.CONNECTION_SUCCESS, () => {
    // 连接成功时立即隐藏失败弹窗，并清除失败状态
    alertConfig.value.show = false;
    alertConfig.value.content = '';
  });
});

// 组件卸载前执行清理工作
onBeforeUnmount(() => {
  console.log('组件卸载，清理资源');

  // 使用增强的地图清理函数
  cleanupMap();
});
</script>

<style lang="scss">
.map-container {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  width: 100%;
  height: 100%;
  overflow: hidden;
  /* 防止内容溢出 */
}

#map {
  background-image: url('/assets/map_bg.png');
  transform: translate3d(0, 0, 0);
  backface-visibility: hidden;
}

.top-bar {
  $height: 0.7rem;
  $clip: polygon(0% 0%, calc(100% - $height) 0%, 100% 100%, 0% 100%);
  height: $height;
  -webkit-clip-path: $clip;
  clip-path: $clip;
  margin-bottom: -0.01em;
}
</style>
