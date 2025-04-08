<template>
  <div>
    <div
      ref="targetRef"
      class="w-full h-64 bg-gray-100 dark:bg-gray-700 flex items-center justify-center border border-dashed border-gray-300 dark:border-gray-600 rounded-lg"
      @contextmenu="onContextMenu"
    >
      在此区域右键点击
    </div>

    <ContextMenu
      v-model="menuVisible"
      ref="contextMenuRef"
    >
      <ContextMenuItem
        label="查看"
        icon="👁️"
        shortcut="Ctrl+V"
        :onClick="() => handleAction('view')"
      />
      <ContextMenuItem
        label="复制"
        icon="📋"
        shortcut="Ctrl+C"
        :onClick="() => handleAction('copy')"
      />
      <ContextMenuItem
        label="剪切"
        icon="✂️"
        shortcut="Ctrl+X"
        :onClick="() => handleAction('cut')"
      />
      <ContextMenuDivider />
      <ContextMenuItem
        label="删除"
        icon="🗑️"
        :onClick="() => handleAction('delete')"
        className="text-red-500"
      />
      <ContextMenuItem
        label="禁用选项"
        icon="🚫"
        :disabled="true"
      />
    </ContextMenu>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import ContextMenu from './ContextMenu.vue';
import ContextMenuItem from './ContextMenuItem.vue';
import ContextMenuDivider from './ContextMenuDivider.vue';
import { ContextMenuRef } from './type';

const menuVisible = ref(false);
const contextMenuRef = ref<ContextMenuRef>();

const onContextMenu = (event: MouseEvent) => {
  if (contextMenuRef.value) {
    contextMenuRef.value.showMenu(event);
  }
};

const handleAction = (action: string) => {
  console.log(`执行操作: ${action}`);
  menuVisible.value = false;
};
</script>
