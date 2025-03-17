<template>
  <HeaderMenu v-on:click="onOpen">
    <TranslateIcon />
    <template #title>{{ $t('header.language') }}</template>
  </HeaderMenu>
  <ZmdAlert
    v-model:open="openAlert"
    hide-cancel
    confirm-text="close"
  >
    <h1 class="text-lg font-bold mb-4 text-[#282828]">
      {{ $t('header.change_language') }}
    </h1>
    <div class="flex flex-col gap-2 w-full p-2">
      <div
        v-for="locale in availableLocales"
        :key="locale.code"
        class="flex items-center justify-between p-2 relative overflow-hidden hover:-translate-y-0.5 transition-transform duration-200 ease-in-out"
        :class="
          cn({
            'bg-[#1D1D1D] text-[white] shadow-[0_0_0_0.1em_inset_#1D1D1D,0_0_0_0.2em_inset_#81807F] hover:shadow-[0_0_0_0.1em_inset_#1D1D1D,0_0_0_0.2em_inset_#81807F,0_0.1em_0.2em_#1D1D1D77]':
              currentLocale === locale.code,
            'bg-white text-[#1D1D1D] shadow-[0_0_0_0.1em_inset_#ABA7A7] hover:bg-[#1D1D1D] hover:text-white hover:shadow-[0_0_0_0.1em_inset_#1D1D1D,0_0_0_0.2em_inset_#81807F,0_0.1em_0.2em_#1D1D1D77]':
              currentLocale !== locale.code,
          })
        "
        @click="changeLanguage(locale.code)"
      >
        <span class="font-medium">{{ locale.name }}</span>
        <span
          v-if="currentLocale === locale.code"
          class="text-[white] animate-scale-in"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
          >
            <polyline points="20 6 9 17 4 12"></polyline>
          </svg>
        </span>
      </div>
    </div>
  </ZmdAlert>
</template>

<script setup lang="ts">
import { cn } from '@/utils/tailwind';
import { ref, computed } from 'vue';
import { useI18n } from 'vue-i18n';

const openAlert = ref(false);
const { locale } = useI18n();

const currentLocale = computed(() => locale.value);

// 可用语言列表
const availableLocales = [
  { code: 'zh-CN', name: '简体中文' },
  { code: 'zh-TW', name: '繁体中文' },
  { code: 'en-US', name: 'English' },
];

const onOpen = () => {
  openAlert.value = true;
};

// 切换语言
const changeLanguage = (lang: string) => {
  locale.value = lang;
  openAlert.value = false;
  localStorage.setItem('userLanguage', lang);
};
</script>

<style lang="scss" scoped>
@keyframes scale-in {
  0% {
    transform: scale(0);
    opacity: 0;
  }
  100% {
    transform: scale(1);
    opacity: 1;
  }
}

.animate-scale-in {
  animation: scale-in 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94) both;
}
</style>
