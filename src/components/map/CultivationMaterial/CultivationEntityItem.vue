<template>
  <!-- <button
    class="text-xs"
    @click="toggle"
  >
    <div
      :class="
        cn(
          'aspect-square mx-1 p-0.5 bg-[#414140] transition-colors duration-200',
          entityInfo.entityInfo.show ? 'border-[#FDFD75]' : 'border-[#414140]',
          'border-b-0'
        )
      "
    >
      <img
        :src="`/assets/${entityInfo.category}/${entityInfo.entityInfo.pic}.png`"
        alt="icon"
        class="w-full h-full object-contain object-center"
      />
    </div>
    <div
      :class="
        cn(
          'text-center truncate transition-colors duration-200',
          entityInfo.entityInfo.show
            ? 'bg-[#FDFD75] text-[#272727]'
            : 'bg-[#FDFBFC] text-black'
        )
      "
    >
      {{ entityInfo.entityInfo.name }}
    </div>
  </button> -->
  <ZmdSidebarObject
    :name="entity.entityInfo.name"
    :checked="entity.entityInfo.show"
    @change="toggle"
    :hide-count="true"
  >
    <img :src="`/assets/${entity.category}/${entity.entityInfo.pic}.png`" />
  </ZmdSidebarObject>
</template>

<script setup lang="ts">
import { toggleSelect } from '@/data/entity';
import { getEntityDataByKey } from '@/data/entity';
// import { cn } from '@/utils/tailwind';
import { computed } from 'vue';

const props = defineProps<{
  id: string;
}>();
const entity = computed(() => {
  return getEntityDataByKey(props.id);
});
const toggle = () => {
  toggleSelect(props.id);
};
</script>

<style scoped></style>
