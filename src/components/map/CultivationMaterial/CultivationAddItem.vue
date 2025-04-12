<template>
  <button
    @click="add"
    class="transition-colors rounded-md duration-200 text-sm relative text-left overflow-hidden"
    :class="cn(!props.active ? 'text-[#D4D4D4]' : 'text-[#272727]')"
  >
    <div
      class="h-17 w-full overflow-hidden transition-colors duration-200 flex justify-end bg-[#383838]"
    >
      <AnimatePresence>
        <motion.div class="absolute top-0 left-0 bottom-0 bg-[#FDFD59] pointer-events-none" v-if="props.active"
          :animate=" {
            width: '100%',
          }"
          :exit="{
            width: 0,
          }"
          :initial="{
            width: 0,
          }"
        ></motion.div>
      </AnimatePresence>
      <img
        :src="props.icon"
        alt="icon"
        class="h-full w-full object-contain opacity-30 mix-blend-luminosity relative z-1 object-right"
      ></img>

      <motion.img
        :src="props.icon"
        alt="icon"
        class="h-full w-full object-contain absolute right-0 z-1 object-right"
        :animate=" {
          clipPath: props.active ? 'inset(0 0 0 0)' : 'inset(0 100% 0 0)',
        }"
      ></motion.img>
    </div>
    <div class="truncate absolute left-1 bottom-1 right-0 z-10" :class=" cn(
  !!props.active && '[text-shadow:0_1px_0_#FDFD59,1px_0_0_#FDFD59,-1px_0_0_#FDFD59,0_-1px_0_#FDFD59]',
    )">{{ props.name }}</div>
  </button>
</template>

<script setup lang="ts">
import { cn } from '@/utils/tailwind';
import { AnimatePresence, motion } from 'motion-v';

const props = withDefaults(
  defineProps<{
    icon: string;
    name: string;
    id: string;
    active?: boolean;
  }>(),
  {
    active: false,
  }
);

const emit = defineEmits<{
  (e: 'toggle', id: string): void;
}>();

const add = () => {
  emit('toggle', props.id);
};
</script>

<style lang="scss" scoped></style>
