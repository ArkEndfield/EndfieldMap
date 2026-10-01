import { logger } from '@endfieldmap/tools';
import { action, observable, runInAction } from 'mobx';

import { service } from '@/services';

const STORAGE_KEY = 'zmd_player_position_enabled';
const FOLLOW_TIER_STORAGE_KEY = 'zmd_player_position_follow_tier';

/**
 * 轮询间隔：森空岛位置接口为分钟级更新，15s 已足够跟手；连续失败时按 2 倍
 * 退避到上限，页面隐藏（后台 tab）时暂停轮询、回到前台立即补一次。
 */
const POLL_INTERVAL_MS = 15_000;
const POLL_MAX_INTERVAL_MS = 60_000;

function readFlag(key: string, fallback: boolean): boolean {
  try {
    const value = localStorage.getItem(key);
    return value === null ? fallback : value === '1';
  } catch {
    // localStorage 不可用（隐私模式等）时仅保持内存态
    return fallback;
  }
}

function writeFlag(key: string, value: boolean): void {
  try {
    localStorage.setItem(key, value ? '1' : '0');
  } catch {
    // localStorage 不可用时静默降级为会话内开关
  }
}

/** 玩家在地图上的当前位置（游戏世界坐标）。 */
export interface PlayerPosition {
  mapId: string;
  levelId: string;
  x: number;
  y: number;
  z: number;
  /** 后端拉取成功的时间戳，用于判断数据是否新鲜 */
  updatedAt: number;
}

/**
 * 玩家实时位置（森空岛位置同步）。
 *
 * 负责轮询后端 `/user/game-roles/position` 并持有最新坐标；渲染由
 * usePlayerPositionLayer 负责。位置同步需登录 + 绑定角色，未登录时
 * start() 会被 hook 调用方跳过。
 */
class PlayerPositionStore {
  /** 是否开启位置同步（用户设置项，持久化） */
  @observable
  accessor enabled: boolean = readFlag(STORAGE_KEY, false);

  /** 是否跟随玩家所在分层自动切换分层图（用户设置项，默认开，持久化） */
  @observable
  accessor followTier: boolean = readFlag(FOLLOW_TIER_STORAGE_KEY, true);

  /** 最新位置；null 表示尚未拉到或玩家离线 */
  @observable
  accessor position: PlayerPosition | null = null;

  private timer: ReturnType<typeof setTimeout> | null = null;
  private inflight = false;
  private roleId: string | null = null;
  private intervalMs = POLL_INTERVAL_MS;
  /** 每次 start/stop 自增，让旧轮询链的回调自行失效，防止双定时器 */
  private epoch = 0;
  private onVisibilityChange: (() => void) | null = null;

  @action
  public setEnabled(value: boolean): void {
    this.enabled = value;
    writeFlag(STORAGE_KEY, value);
  }

  @action
  public setFollowTier(value: boolean): void {
    this.followTier = value;
    writeFlag(FOLLOW_TIER_STORAGE_KEY, value);
  }

  /**
   * 开始轮询。重复调用安全；roleId 变化时会立即重新拉取。
   */
  public start(roleId?: string | null): void {
    const next = roleId ?? null;
    if (this.timer && next === this.roleId) {
      return;
    }
    this.stop();
    this.roleId = next;
    this.intervalMs = POLL_INTERVAL_MS;
    this.epoch += 1;
    const epoch = this.epoch;
    this.onVisibilityChange = () => {
      // 后台 tab 暂停轮询由 tick() 跳过实现；回到前台立即补一次
      if (document.visibilityState === 'visible' && this.epoch === epoch) {
        void this.refresh();
      }
    };
    document.addEventListener('visibilitychange', this.onVisibilityChange);
    void this.refresh();
    this.schedule(epoch);
  }

  public stop(): void {
    this.epoch += 1;
    if (this.timer) {
      clearTimeout(this.timer);
      this.timer = null;
    }
    if (this.onVisibilityChange) {
      document.removeEventListener('visibilitychange', this.onVisibilityChange);
      this.onVisibilityChange = null;
    }
    runInAction(() => {
      this.position = null;
    });
  }

  private schedule(epoch: number): void {
    if (this.epoch !== epoch) {
      return;
    }
    this.timer = setTimeout(() => {
      this.timer = null;
      void this.tick(epoch);
    }, this.intervalMs);
  }

  private async tick(epoch: number): Promise<void> {
    if (this.epoch !== epoch) {
      return;
    }
    if (document.hidden) {
      // 后台 tab 不发请求，按基础间隔待命
      this.intervalMs = POLL_INTERVAL_MS;
      this.schedule(epoch);
      return;
    }
    const ok = await this.refresh();
    if (this.epoch !== epoch) {
      return;
    }
    this.intervalMs = ok ? POLL_INTERVAL_MS : Math.min(this.intervalMs * 2, POLL_MAX_INTERVAL_MS);
    this.schedule(epoch);
  }

  /** 立即拉取一次位置；返回是否成功。并发调用会被合并。 */
  public async refresh(): Promise<boolean> {
    if (this.inflight) {
      return true;
    }
    this.inflight = true;
    try {
      const res = await service.sklandPositionService.fetchPosition(this.roleId ?? undefined);
      runInAction(() => {
        // 玩家离线或坐标缺省时清空位置，避免残留一个过时标记
        this.position =
          res.online && res.mapId
            ? {
                mapId: res.mapId,
                levelId: res.levelId ?? '',
                x: res.x,
                y: res.y,
                z: res.z,
                updatedAt: Date.now(),
              }
            : null;
      });
      return true;
    } catch (err) {
      logger.debug('[PlayerPosition] refresh failed', err);
      return false;
    } finally {
      this.inflight = false;
    }
  }
}

export const playerPositionStore = new PlayerPositionStore();
