<template>
  <div class="flex justify-center items-center">
    <div
      class="w-[300px] bg-white rounded-lg shadow-md overflow-hidden transition-all duration-300 hover:transform hover:-translate-y-1 hover:shadow-lg"
      @click="navigateToUserPage"
    >
      <div class="relative bg-[#fb7299] h-[70px]">
        <div class="flex absolute bottom-[-36px] left-0 right-0 px-[15px]">
          <img
            :src="user.avatar"
            :alt="user.name"
            class="w-[72px] h-[72px] rounded-full border-4 border-white object-cover shadow-sm"
            referrerpolicy="no-referrer"
          />
          <div class="ml-3 mt-2">
            <div class="flex items-center">
              <span class="text-lg font-bold text-[#fff] mr-2">{{
                user.name
              }}</span>
              <span
                class="bg-[#DE5950] text-white rounded px-1 text-xs flex items-center"
                >Lv{{ user.level }}</span
              >
            </div>
            <div
              v-if="user.certification"
              class="text-sm text-gray-600 mt-1"
            >
              <span class="inline-flex items-center">
                <svg
                  class="w-4 h-4 text-[#fb7299] mr-1"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    fill-rule="evenodd"
                    d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                    clip-rule="evenodd"
                  ></path>
                </svg>
                {{ t(user.certification) }}
              </span>
            </div>
          </div>
        </div>
      </div>
      <div class="pt-10 px-2 pb-2 mt-2">
        <!-- 获赞数和播放数 -->
        <div class="flex space-x-4 justify-center mb-4 text-sm text-gray-600">
          <div class="flex items-center">
            <svg
              class="w-4 h-4 text-[#fb7299] mr-1"
              fill="currentColor"
              viewBox="0 0 20 20"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M2 10.5a1.5 1.5 0 113 0v6a1.5 1.5 0 01-3 0v-6zM6 10.333v5.43a2 2 0 001.106 1.79l.05.025A4 4 0 008.943 18h5.416a2 2 0 001.962-1.608l1.2-6A2 2 0 0015.56 8H12V4a2 2 0 00-2-2 1 1 0 00-1 1v.667a4 4 0 01-.8 2.4L6.8 7.933a4 4 0 00-.8 2.4z"
              ></path>
            </svg>
            {{ formatCount(user.likeCount) }} {{ t('bilibili_card.like') }}
          </div>
          <div class="flex items-center">
            <svg
              class="w-4 h-4 text-[#fb7299] mr-1"
              fill="currentColor"
              viewBox="0 0 20 20"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z"
              ></path>
            </svg>
            {{ formatCount(user.playCount) }} {{ t('bilibili_card.play') }}
          </div>
        </div>

        <div class="flex items-center justify-between">
          <!-- 关注按钮 -->
          <button
            class="flex-1 bg-[#fb7299] hover:bg-[#fc8bab] text-white font-bold py-2 px-4 rounded transition-colors duration-300"
          >
            + {{ t('bilibili_card.follow') }}
            <span>{{ formatFansCount(user.fansCount) }}</span>
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useI18n } from 'vue-i18n';

const { t, locale } = useI18n();

export interface BilibiliUser {
  id: string;
  name: string;
  avatar: string;
  level: number;
  fansCount: number;
  likeCount: number;
  playCount: number;
  certification?: string;
  spaceUrl?: string;
}
const props = withDefaults(
  defineProps<{
    user?: BilibiliUser;
  }>(),
  {
    user: () => ({
      id: '432131619',
      name: '绝命笋干',
      avatar:
        'https://i2.hdslb.com/bfs/face/dd225519e6fc79c251d3fc442ab161ca72ced644.jpg@256w_256h_1c_1s.webp',
      level: 6,
      fansCount: 451001,
      likeCount: 4085199,
      playCount: 78057926,
      certification: 'bilibili_card.certification.game',
    }),
  }
);

const navigateToUserPage = () => {
  window.open(
    props.user.spaceUrl || `https://space.bilibili.com/${props.user.id}`,
    '_blank'
  );
};

const formatFansCount = (count: number) => {
  // 根据不同语言展示不同的单位
  if (locale.value.startsWith('zh')) {
    // 中文格式 (zh-cn 和 zh-tw)
    if (count >= 100000000) {
      return (count / 100000000).toFixed(1) + t('bilibili_card.number.yi');
    }
    if (count >= 10000) {
      return (count / 10000).toFixed(1) + t('bilibili_card.number.wan');
    }
  } else {
    // 英文格式
    if (count >= 1000000) {
      return (count / 1000000).toFixed(1) + t('bilibili_card.number.yi'); // M
    }
    if (count >= 1000) {
      return (count / 1000).toFixed(1) + t('bilibili_card.number.wan'); // K
    }
  }
  return count.toString();
};

const formatCount = (count: number) => {
  // 根据不同语言展示不同的单位
  if (locale.value.startsWith('zh')) {
    // 中文格式
    if (count >= 100000000) {
      return (count / 100000000).toFixed(1) + t('bilibili_card.number.yi');
    }
    if (count >= 10000) {
      return (count / 10000).toFixed(1) + t('bilibili_card.number.wan');
    }
  } else {
    // 英文格式
    if (count >= 1000000) {
      return (count / 1000000).toFixed(1) + t('bilibili_card.number.yi'); // M
    }
    if (count >= 1000) {
      return (count / 1000).toFixed(1) + t('bilibili_card.number.wan'); // K
    }
  }
  return count.toString();
};
</script>
