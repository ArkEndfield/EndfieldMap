<template>
  <motion.div
    :animate="{
      x: 0,
      opacity: 1,
    }"
    :exit="{
      x: -100,
      opacity: 0,
    }"
    :initial="{
      x: -100,
      opacity: 0,
    }"
    class="text-white"
  >
    <div class="top-bar bg-[#464646]"></div>
    <div class="bg-[#464646] p-2">
      <div class="flex items-center gap-1 -mt-3">
        <div>
          <img
            :src="icon"
            alt="icon"
            class="w-8 h-8 object-contain"
          />
        </div>
        <div class="flex flex-col">
          <div class="text-sm font-bold">{{ name }}</div>
          <div class="text-xs text-[#A0A0A0]">ID: {{ id }}</div>
        </div>
        <button
          class="ml-auto text-xs w-4 h-4 flex items-center justify-center rounded-full bg-[#FDFD59] text-[#272727] hover:bg-[#FDFD59] active:bg-[#f2f27a] transition-all duration-200 shadow-md hover:shadow-sm -mt-2"
          @click="deleteItem"
        >
          <CloseIcon />
        </button>
      </div>
      <div class="bg-[#272727] text-white p-2 mt-2 grid grid-cols-2 gap-1">
        <CultivationEntityItem
          v-for="entity in displayEntity"
          :key="entity.entityInfo.point"
          :entity="entity"
        />
      </div>
    </div>
  </motion.div>
</template>

<script setup lang="ts">
import { getCharMaterial, getWeaponMaterial } from '@/services/material';
import { select, unSelect } from '@/services/entity';
import type { Material } from '@/types/material';
import { motion } from 'motion-v';
import { onUnmounted } from 'vue';
import { computed, onMounted, ref } from 'vue';
import { getEntityDataByPic } from '@/services/entity';
import type { EntityCategories } from '@/types/entity';
import { watch } from 'vue';
const material = ref<Material>();
const displayEntity = computed(() => {
  const data: EntityCategories['string'][] = [];
  for (const key in material.value) {
    if (props.type === 'character') {
      const entity = getEntityDataByPic(key);
      if (entity) data.push(entity);
    } else {
      const entity = getEntityDataByPic(key);
      if (entity) data.push(entity);
    }
  }
  return data;
});
const props = defineProps<{
  id: string;
  name: string;
  icon: string;
  type: 'character' | 'weapon';
}>();
const emit = defineEmits<{
  (e: 'delete', id: string): void;
}>();
const deleteItem = () => {
  emit('delete', props.id);
};
const getEntityData = async () => {
  if (props.type === 'character') {
    const data = await getCharMaterial(props.id);
    return data || {};
  }
  const data = await getWeaponMaterial(props.id);
  return data || {};
};

watch(
  () => displayEntity.value,
  newVal => {
    if (newVal.length > 0) {
      select(...newVal.map(item => item.entityInfo.point));
    }
  },
  { immediate: true }
);

onMounted(async () => {
  const idList = await getEntityData();
  if (idList) {
    material.value = idList;
  }
});

onUnmounted(() => {
  if (displayEntity.value.length > 0) {
    unSelect(...displayEntity.value.map(item => item.entityInfo.point));
  }
  material.value = {};
});
</script>

<style lang="scss" scoped>
.top-bar {
  $height: 0.7rem;
  $clip: polygon(0% 0%, calc(100% - $height) 0%, 100% 100%, 0% 100%);
  height: $height;
  -webkit-clip-path: $clip;
  clip-path: $clip;
  margin-bottom: -0.01em;
}
</style>
