<template>
  <div v-if="showRewards">
    <RewardTitle>{{ t('popover.reward.chest.title') }}</RewardTitle>
    <div
      v-if="rewards && rewards.length > 0"
      class="grid grid-cols-2 gap-x-4 gap-y-8 px-2"
    >
      <PopContentItem
        v-for="rwd in rewards"
        :key="rwd.id"
      >
        <template #icon>
          <img
            :src="rwd.icon"
            :alt="t(`item.${rwd.id}.name`)"
            class="w-full h-full object-contain"
          />
        </template>
        <template
          #count
          v-if="rwd.count"
          >{{ rwd.count }}</template
        >
        {{ t(`item.${rwd.id}.name`) }}
      </PopContentItem>
    </div>
    <div
      v-else
      class="text-center text-gray-400 py-4"
    >
      暂无奖励信息
    </div>
  </div>
</template>

<script setup lang="ts">
import { getRewards, isChestReward } from '@/services/reward';
import { PointData } from '@/types/points';
import type { ReturnRewardItem } from '@/types/reward';
import { watch } from 'vue';
import { ref, computed } from 'vue';
import { useI18n } from 'vue-i18n';

const props = defineProps<{
  point: PointData | null;
}>();
const { t } = useI18n();

const rewards = ref<ReturnRewardItem[]>([]);
const showRewards = computed(() => {
  return isChestReward(props.point);
});

watch(
  () => props.point,
  async newPoint => {
    if (newPoint && isChestReward(newPoint)) {
      rewards.value = await getRewards(newPoint.reward_id);
    } else {
      rewards.value = [];
    }
  },
  { immediate: true }
);
</script>

<style lang="scss" scoped></style>
