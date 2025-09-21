import { ref } from "vue";

import { loadGuidesData } from '@/services/guides';
import { initMarksData } from '@/services/marks';
import { loadMaterialData } from '@/services/material';
import { initializeSettings } from '@/services/settings';
import { updatePoints, getCurrentPoints } from '@/services/points';
import { loadEntityData, initializeEntity } from '@/services/entity';
import { loadRewardData } from '@/services/reward';
import { getCurrentMapId } from '@/services/map';


// 在 setup 中添加数据加载逻辑
export const isLoading = ref(true);
export const loadError = ref<Error | null>(null);

// 加载所有必要的数据
export async function loadAllData() {
  try {
    isLoading.value = true;
    loadError.value = null;

    // 预加载地图背景图片
    const mapBg = new Image();
    mapBg.src = '/assets/map_bg.png';
    await new Promise(resolve => {
      mapBg.onload = resolve;
      mapBg.onerror = resolve;
    });
    console.log('地图背景图片预加载完成');

    console.log('开始加载所有数据...');
    const mapID = getCurrentMapId();
    // 先加载实体数据
    await loadEntityData();
    console.log('实体数据加载完成');
    await updatePoints(mapID);
    // 加载点位数据 - 使用getCurrentPoints获取预加载的点位
    const points = await getCurrentPoints();

    // 如果没有点位数据，可能是预加载失败，尝试重新加载
    if (!points || points.length === 0) {
      console.log('未找到预加载的点位数据，尝试重新加载...');
      const freshPoints = await updatePoints(mapID);
      console.log('点位数据重新加载完成，加载了', freshPoints.length, '个点位');
    } else {
      console.log('使用预加载的点位数据，共', points.length, '个点位');
    }

    console.log('开始加载奖励数据...');
    // 加载奖励数据
    await loadRewardData();
    console.log('奖励数据加载完成');

    console.log('开始加载攻略数据...');
    // 加载攻略数据
    await loadGuidesData();
    console.log('攻略数据加载完成');

    console.log('开始加载材料数据...');
    await loadMaterialData();
    console.log('材料数据加载完成');

    console.log('开始初始化地图...');
    // 初始化实体信息和地图
    await initializeEntity();
    console.log('地图初始化完成');

    console.log('开始初始化已完成数据...');
    // 确保使用await等待marks数据初始化完成
    await initMarksData();
    console.log('已完成数据初始化完成');

    console.log('开始初始化设置...');
    await initializeSettings();
    console.log('设置初始化完成');

    console.log('所有数据加载完成');
    isLoading.value = false;
  } catch (error) {
    console.error('加载数据失败:', error);
    loadError.value = error as Error;
    isLoading.value = false;
  }
}