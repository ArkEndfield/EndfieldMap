<template>
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
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useI18n } from 'vue-i18n';
import type { Coordinate } from 'ol/coordinate';
import type { PointData } from '@/types/points';
import { isMarked, markPoint } from '@/services/marks';
import { createCustomPoint, deleteCustomPoint, isCustomPoint } from '@/services/customPoints';
import { removeConnection, startConnectionMode, getPoleConnections, MAX_CONNECTIONS_PER_POLE } from '@/services/electricPoleConnector';
import { getCurrentMapId, addMapContextMenuListener } from '@/services/map';
import { ContextMenuRef } from '@/components/ContextMenu/type';
import ContextMenu from '@/components/ContextMenu/ContextMenu.vue';
import ContextMenuItem from '@/components/ContextMenu/ContextMenuItem.vue';
import CheckCircleIcon from '@/components/icons/CheckCircleIcon.vue';
import LocationClusterIcon from '@/components/icons/LocationClusterIcon.vue';
import TrashIcon from '@/components/icons/TrashIcon.vue';

const { t } = useI18n();

const menuVisible = ref(false);
const contextMenuRef = ref<ContextMenuRef>();
const rightClickCoordinates = ref<Coordinate | null>(null);
const rightClickCustomPoint = ref<PointData | null>(null);
const rightClickPoint = ref<PointData | null>(null);
const rightClickLineGroupId = ref<string | null>(null);

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
  const connectionCount = getPoleConnections(rightClickCustomPoint.value);
  return connectionCount < MAX_CONNECTIONS_PER_POLE;
});

const handleAction = (action: string) => {
  menuVisible.value = false;
  const currentMap = getCurrentMapId();
  if (action === ACTION.CREATE) {
    if (rightClickCoordinates.value) {
      createCustomPoint(rightClickCoordinates.value, currentMap);
    }
  } else if (action === ACTION.CREATE_ELECTRIC_POLE) {
    if (rightClickCoordinates.value) {
      createCustomPoint(rightClickCoordinates.value, currentMap, 'electric_pole');
    }
  } else if (action === ACTION.CONNECT_POLES) {
    if (rightClickCustomPoint.value) {
      startConnectionMode(rightClickCustomPoint.value);
    }
  } else if (action === ACTION.DELETE_CONNECTION) {
    if (rightClickLineGroupId.value) {
      removeConnection(rightClickLineGroupId.value);
      rightClickLineGroupId.value = null;
    }
  } else if (action === ACTION.DELETE) {
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

const onContextMenu = (event: MouseEvent) => {
  if (contextMenuRef.value) {
    contextMenuRef.value.showMenu(event);
  }
};

const closeMenu = () => {
  menuVisible.value = false;
};

defineExpose({
  onContextMenu,
  closeMenu,
});

onMounted(() => {
  addMapContextMenuListener((_event: MouseEvent, coordinate?: Coordinate, point?: PointData, lineGroupId?: string) => {
    rightClickCoordinates.value = coordinate || null;
    rightClickLineGroupId.value = lineGroupId || null;

    if (point && isCustomPoint(point)) {
      rightClickCustomPoint.value = point;
      rightClickPoint.value = null;
    } else if (point) {
      rightClickPoint.value = point;
      rightClickCustomPoint.value = null;
    } else {
      rightClickCustomPoint.value = null;
      rightClickPoint.value = null;
    }
  });
});
</script>