import type { EndfieldMapAdapter } from '@endfieldmap/map-adapter-ol';
import { Z_INDEX } from '@endfieldmap/map-adapter-ol/render/zIndex';
import { logger } from '@endfieldmap/tools';
import { reaction } from 'mobx';
import { Feature } from 'ol';
import { Point } from 'ol/geom';
import VectorLayer from 'ol/layer/Vector';
import VectorSource from 'ol/source/Vector';
import Style from 'ol/style/Style';
import { useEffect } from 'react';

import { locatePlayerTier, usePlayerTierFollow } from '@/hooks/use_player_tier';
import { service } from '@/services';
import { playerPositionStore } from '@/services/player_position_store';

/** 玩家标记颜色（与标点色系区分开） */
const PLAYER_COLOR = '#3FC6FF';

/** 玩家标记主圆半径（像素） */
const PLAYER_RADIUS = 7;

/** 脉冲动画一周期（毫秒） */
const PULSE_PERIOD_MS = 1800;

/** activeTier 形如 "map01_lv001_2_3"（关卡名 + 网格坐标），取回关卡名部分。 */
function tierLevelId(activeTier: string): string {
  const parts = activeTier.split('_');
  return parts.length > 2 ? parts.slice(0, -2).join('_') : activeTier;
}

/**
 * 玩家实时位置图层 + 轮询生命周期。
 *
 * 开启位置同步且已登录时按固定间隔拉取后端位置；坐标经 dataManager.xyz2crd
 * 换算后以脉冲圆点绘制。打开分层图时只在玩家所在的那一层上显示，避免在错误的
 * 分层上出现一个看起来「悬空」的标记；玩家进出分层时分层图跟着切换（见 usePlayerTierFollow）。
 */
export function usePlayerPositionLayer(adapter: EndfieldMapAdapter): void {
  usePlayerTierFollow(adapter);

  // 轮询生命周期：开关 / 登录态 / 当前角色任一变化都重算
  useEffect(() => {
    const dispose = reaction(
      () => ({
        enabled: playerPositionStore.enabled,
        isLogin: service.userService.auth.isLogin,
        uid: service.userService.auth.currentUidInfo?.uid ?? null,
      }),
      ({ enabled, isLogin, uid }) => {
        if (enabled && isLogin) {
          playerPositionStore.start(uid);
        } else {
          playerPositionStore.stop();
        }
      },
      { fireImmediately: true }
    );
    return () => {
      dispose();
      playerPositionStore.stop();
    };
  }, []);

  // 图层渲染
  useEffect(() => {
    const dataManager = adapter.mapController.dataManager;
    const tierDataManager = adapter.tierController.tierDataManager;
    const olMap = adapter.mapController.olMapRenderer.map;

    const source = new VectorSource();
    const feature = new Feature(new Point([0, 0]));
    const layer = new VectorLayer({
      source,
      zIndex: Z_INDEX.PLAYER,
      updateWhileAnimating: true,
      style: new Style({
        renderer: (pixelCoordinates, state) => {
          const { context, pixelRatio } = state;
          const [x, y] = pixelCoordinates as number[];
          const pulse = (performance.now() % PULSE_PERIOD_MS) / PULSE_PERIOD_MS;

          context.save();
          context.translate(x, y);

          // 外圈脉冲：半径随进度扩散、透明度衰减
          context.beginPath();
          context.arc(0, 0, (PLAYER_RADIUS + 3 + pulse * 14) * pixelRatio, 0, Math.PI * 2);
          context.fillStyle = PLAYER_COLOR;
          context.globalAlpha = 0.35 * (1 - pulse);
          context.fill();

          // 主圆点：白描边 + 投影，保证在任何底色上可辨识
          context.globalAlpha = 1;
          context.beginPath();
          context.arc(0, 0, PLAYER_RADIUS * pixelRatio, 0, Math.PI * 2);
          context.fillStyle = PLAYER_COLOR;
          context.shadowColor = 'rgba(0, 0, 0, 0.45)';
          context.shadowBlur = 4 * pixelRatio;
          context.fill();
          context.shadowBlur = 0;
          context.lineWidth = 2.5 * pixelRatio;
          context.strokeStyle = 'rgba(255, 255, 255, 0.95)';
          context.stroke();

          context.restore();
        },
      }),
    });
    olMap.addLayer(layer);

    let animationFrameId: number | null = null;

    /** 是否应显示玩家标记：开启 + 在线 + 与当前地图/分层一致 */
    const shouldShow = (): boolean => {
      if (!playerPositionStore.enabled) return false;
      const pos = playerPositionStore.position;
      if (!pos || pos.mapId !== dataManager.currentMapId) return false;
      const activeTier = tierDataManager.activeTier;
      if (!activeTier) return true;
      // 能按三维坐标判定分层时精确比较；判定不了（缺分层体积数据）时退回按关卡比较
      const region = locatePlayerTier(tierDataManager, pos);
      if (region !== undefined) {
        return region?.tierId === activeTier && region.subTierId === tierDataManager.activeSubTier;
      }
      if (pos.levelId && pos.levelId !== tierLevelId(activeTier)) return false;
      return true;
    };

    /** 脉冲动画循环：仅在标记可见时逐帧重绘 */
    const animate = (): void => {
      if (!source.hasFeature(feature)) {
        animationFrameId = null;
        return;
      }
      feature.changed();
      animationFrameId = requestAnimationFrame(animate);
    };

    const startAnimation = (): void => {
      if (animationFrameId === null) {
        animationFrameId = requestAnimationFrame(animate);
      }
    };

    const apply = (): void => {
      const pos = playerPositionStore.position;
      if (!shouldShow() || !pos) {
        source.clear();
        return;
      }
      try {
        const coordinate = dataManager.xyz2crd({ x: pos.x, y: pos.y, z: pos.z }, pos.mapId);
        feature.getGeometry()?.setCoordinates(coordinate);
        if (!source.hasFeature(feature)) {
          source.addFeature(feature);
        }
        startAnimation();
      } catch (error) {
        // 位置所属地图不在本地数据里（新地图尚未更新），静默跳过
        source.clear();
        logger.debug('[PlayerPosition] coordinate transform failed', error);
      }
    };

    // 位置、开关、当前地图、当前分层、分层体积数据任一变化都重算
    const dispose = reaction(
      () => ({
        enabled: playerPositionStore.enabled,
        position: playerPositionStore.position,
        mapId: dataManager.currentMapId,
        activeTier: tierDataManager.activeTier,
        activeSubTier: tierDataManager.activeSubTier,
        hasTierVolumes: tierDataManager.hasTierVolumes,
      }),
      () => apply(),
      { fireImmediately: true }
    );

    return () => {
      dispose();
      if (animationFrameId !== null) {
        cancelAnimationFrame(animationFrameId);
        animationFrameId = null;
      }
      olMap.removeLayer(layer);
      source.clear();
    };
  }, [adapter]);
}
