<template>
  <div
    ref="selectRef"
    class="custom-select"
    :class="{ 'is-open': isOpen }"
  >
    <div
      class="select-header"
      @click="toggleOpen"
    >
      <div class="selected-content">
        <img
          v-if="selectedIcon"
          :src="selectedIcon"
          class="option-icon"
          alt=""
        />
        <span class="selected-value">{{ selectedLabel }}</span>
      </div>
      <svg
        class="arrow"
        width="16"
        height="16"
        viewBox="0 0 12 12"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          d="M2.5 4.5L6 8L9.5 4.5"
          stroke="currentColor"
          stroke-width="1.5"
          stroke-linecap="round"
          stroke-linejoin="round"
        />
      </svg>
    </div>
    <AnimatePresence>
      <motion.div
        v-if="isOpen"
        class="select-options"
        :animate="{
          opacity: [0, 1],
          height: [0, 'auto'],
        }"
        :exit="{
          opacity: [1, 0],
          height: ['auto', 0],
        }"
        :transition="{
          type: 'spring',
          duration: 0.3,
        }"
      >
        <div
          v-for="option in options"
          :key="option.value"
          class="option"
          :class="{ 'is-selected': modelValue === option.value }"
          @click="selectOption(option)"
        >
          <img
            v-if="option.icon"
            :src="option.icon"
            class="option-icon"
            alt=""
          />
          <span class="option-label">{{ option.label }}</span>
        </div>
      </motion.div>
    </AnimatePresence>
  </div>
</template>

<script setup lang="ts">
import { AnimatePresence, motion } from 'motion-v';
import { ref, computed, onMounted, onUnmounted } from 'vue';

interface Option {
  value: string;
  label: string;
  icon?: string;
}

const props = defineProps<{
  modelValue: string;
  options: Option[];
}>();

const emit = defineEmits<{
  (e: 'update:modelValue', value: string): void;
}>();

const isOpen = ref(false);

const selectedOption = computed(() => {
  return props.options.find(opt => opt.value === props.modelValue);
});

const selectedLabel = computed(() => {
  return selectedOption.value?.label || '';
});

const selectedIcon = computed(() => {
  return selectedOption.value?.icon;
});

const toggleOpen = () => {
  isOpen.value = !isOpen.value;
};

const selectOption = (option: Option) => {
  emit('update:modelValue', option.value);
  isOpen.value = false;
};

const selectRef = ref<HTMLElement | null>(null);

const handleClickOutside = (event: MouseEvent) => {
  if (selectRef.value && !selectRef.value.contains(event.target as Node)) {
    isOpen.value = false;
  }
};

onMounted(() => {
  document.addEventListener('click', handleClickOutside);
});

onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside);
});
</script>

<style lang="scss" scoped>
$primary-color: #fdfb72;
$primary-text-color: #2a2728;
$primary-hover-color: #fdfb72b5;
$primary-border-color: #2a2728;
$secondary-color: #2a2728;
$secondary-text-color: #fefcfc;
$secondary-hover-color: #2a2728b5;
$secondary-border-color: #81807f;

.custom-select {
  position: relative;
  width: 100%;
}

.select-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.5rem 1rem;
  background-color: $secondary-color;
  color: $secondary-text-color;
  border-radius: 9999px;
  box-shadow: 0 0 0 0.1em $secondary-color,
    0 0 0 0.1em $secondary-border-color inset;
  transition: all 0.2s;
}

.select-header:hover {
  background-color: $secondary-hover-color;
  box-shadow: 0 0 0 0.1em $secondary-hover-color,
    0 0 0 0.1em $secondary-border-color inset;
}

.arrow {
  width: 16px;
  height: 16px;
  transition: transform 0.2s;
  color: $secondary-text-color;
  opacity: 0.7;
}

.is-open .arrow {
  transform: rotate(180deg);
}

.select-options {
  position: absolute;
  top: 100%;
  left: 0;
  right: 0;
  margin-top: 0.5rem;
  background-color: $secondary-color;
  border-radius: 0.75rem;
  overflow: hidden;
  z-index: 10;
  box-shadow: 0 0 0 0.1em $secondary-color,
    0 0 0 0.1em $secondary-border-color inset;
  border: none;
}

.selected-content {
  display: flex;
  align-items: center;
  gap: 0.25rem;
}

.option {
  display: flex;
  align-items: center;
  gap: 0.25rem;
  padding: 0.5rem 0.75rem;
  color: $secondary-text-color;
  transition: all 0.2s;
}

.option:not(.is-selected):hover {
  background-color: rgba(76, 74, 75, 0.2);
}

.option.is-selected {
  background-color: rgba(236, 224, 101, 0.3);
  color: $primary-color;
}

.option:first-child {
  padding-top: 0.5rem;
}

.option:last-child {
  padding-bottom: 0.5rem;
}

.option-icon {
  width: 24px;
  height: 24px;
  object-fit: contain;
}
</style>
