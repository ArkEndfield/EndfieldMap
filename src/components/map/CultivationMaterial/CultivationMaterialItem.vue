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
    class="bg-white text-[#272727] p-2 rounded-sm"
  >
    <div class="flex items-center gap-1">
      <div>
        <img
          :src="icon"
          alt="icon"
          class="w-8 h-8"
        />
      </div>
      <div class="flex flex-col">
        <div class="text-sm font-bold">{{ name }}</div>
        <div class="text-xs text-[#A0A0A0]">ID: {{ id }}</div>
      </div>
      <button
        class="ml-auto text-xs w-4 h-4 flex items-center justify-center rounded-full bg-[#FDFD59] text-[#272727] hover:bg-[#FDFD59] active:bg-[#f2f27a] transition-all duration-200 shadow-md hover:shadow-sm"
        @click="deleteItem"
      >
        <CloseIcon />
      </button>
    </div>
    <div
      class="bg-[#272727] text-white p-1 rounded-md mt-2 grid grid-cols-5 gap-1"
    >
      <CultivationEntityItem
        v-for="id in fakeIds"
        :key="id"
        :id="id"
      />
    </div>
  </motion.div>
</template>

<script setup lang="ts">
import { select } from '@/data/entity';
import { motion } from 'motion-v';
import { onMounted } from 'vue';
const fakeIds = [
  'int_collection_coin',
  'int_collection_coin_puzzle',
  'int_doodad_core_mine_quartz',
  'int_doodad_core_crylplant_1_1',
  'int_doodad_core_crylplant_1_2',
  'int_doodad_core_crylplant_1_3',
];
const props = defineProps<{
  id: string;
  name: string;
  icon: string;
}>();
const emit = defineEmits<{
  (e: 'delete', id: string): void;
}>();
const deleteItem = () => {
  emit('delete', props.id);
};
onMounted(() => {
  select(...fakeIds);
});
</script>

<style lang="scss" scoped></style>
