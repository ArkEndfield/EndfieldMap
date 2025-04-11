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
    <h1 class="text-lg font-bold mb-4 text-[#282828] text-center">
      {{ $t('header.change_language') }}
    </h1>
    <div class="flex flex-col gap-2 w-full py-2 px-6">
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
          class="text-[white]"
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
import { loadTextPoints } from '@/data/locations';
import { cn } from '@/utils/tailwind';
import { ref, computed } from 'vue';
import { useI18n } from 'vue-i18n';
import { type Language, loadLanguage, setLanguage } from '@/i18n';
import { getCurrentMapId } from '@/services/MapCore';

const openAlert = ref(false);
const { locale } = useI18n();

const currentLocale = computed(() => locale.value);

// 可用语言列表
const availableLocales = [
  { code: 'zh-CN', name: '简体中文' },
  { code: 'zh-TW', name: '繁体中文' },
  { code: 'en-US', name: 'English' },
] satisfies { code: Language; name: string }[];

const onOpen = () => {
  openAlert.value = true;
};

// 切换语言
const changeLanguage = async (lang: Language) => {
  // 先尝试加载语言文件
  const success = await loadLanguage(lang);
  if (success) {
    locale.value = lang;
    openAlert.value = false;
    setLanguage(lang);
  } else {
    console.error('加载语言文件失败，将使用中文作为后备语言');
    // 如果加载失败，使用中文作为后备语言
    locale.value = 'zh-CN';
    setLanguage('zh-CN');
  }
  const currentMapId = getCurrentMapId();
  loadTextPoints(true, currentMapId);
};
</script>

<style lang="scss" scoped></style>
