<template>
  <button
    class="text-xs"
    @click="toggle"
  >
    <div
      :class="
        cn(
          'aspect-square mx-1 p-0.5 bg-[#414140] rounded-t-sm border transition-colors duration-200',
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
          'text-center truncate rounded-t-xs rounded-b-sm transition-colors duration-200',
          entityInfo.entityInfo.show
            ? 'bg-[#FDFD75] text-[#272727]'
            : 'bg-[#FDFBFC] text-black'
        )
      "
    >
      {{ entityInfo.entityInfo.name }}
    </div>
  </button>
</template>

<script setup lang="ts">
import { toggleSelect } from '@/data/entity';
import { getEntityDataByKey } from '@/data/entity';
import { cn } from '@/utils/tailwind';
import { computed } from 'vue';

const props = defineProps<{
  id: string;
}>();
const entityInfo = computed(() => {
  return getEntityDataByKey(props.id);
});
const toggle = () => {
  toggleSelect(props.id);
};
</script>

<style scoped></style>
