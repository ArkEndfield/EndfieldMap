<template>
  <template v-if="showRewards">
    <div v-if="rewards && Object.keys(rewards).length > 0">
      <div
        v-for="(rwds, key) in rewards"
        :key="key"
        class="mb-8 last:mb-0"
      >
        <RewardTitle>{{ key }}</RewardTitle>
        <div class="grid grid-cols-2 gap-x-4 gap-y-8 px-2">
          <PopContentItem
            v-for="rwd in rwds"
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
      </div>
    </div>
    <div
      v-else
      class="text-center text-gray-400 py-4"
    >
      暂无奖励信息
    </div>
  </template>
</template>

<script setup lang="ts">
import { getDungeonRewards, isDungeonReward } from '@/services/reward';
import { PointData } from '@/types/points';
import type { ReturnRewardItem } from '@/types/reward';
import { watch } from 'vue';
import { ref, computed } from 'vue';
import { useI18n } from 'vue-i18n';

const props = defineProps<{
  entity: PointData | null;
}>();
const { t } = useI18n();

const rewards = ref<Record<string, ReturnRewardItem[]>>({});
const showRewards = computed(() => {
  return isDungeonReward(props.entity);
});

// 监听 entity 变化以异步加载奖励数据
watch(
  () => props.entity,
  async newEntity => {
    if (newEntity && isDungeonReward(newEntity)) {
      rewards.value = await getDungeonRewards(newEntity);
    } else {
      rewards.value = {};
    }
  },
  { immediate: true }
);
</script>

<style lang="scss" scoped></style>
