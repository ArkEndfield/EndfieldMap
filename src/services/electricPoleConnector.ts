import { ref, computed } from 'vue';
import type { PointData } from '@/types/points';
import { connectPoints, removeLineGroup, lineGroups } from '@/services/lineConnector';
import { getItemMap } from '@/services/render';
import { getItem, setItem } from '@/utils/indexedDBStorage';
import { DATA_DB_KEY } from '@/constants/db_key';
import { StorageType } from '@/utils/indexedDBStorage';
import { EVENTS, pubsub } from '@/services/pubsub';
import { entityShowStates } from '@/data/entity';

// 连线状态管理
const isConnectionMode = ref(false);
const currentConnectionPole = ref<PointData | null>(null);
const connectionHistory = ref<PointData[]>([]);
const connectionLines = ref<Map<string, string>>(new Map()); // lineId -> lineGroupId

// 连线配置
export const MAX_CONNECTION_DISTANCE = 40; // 最大连线距离
export const MAX_CONNECTIONS_PER_POLE = 2; // 每个电线杆最多连接数

/**
 * 开始连线模式
 * @param pole 起始电线杆
 */
export const startConnectionMode = (pole: PointData) => {
  isConnectionMode.value = true;
  currentConnectionPole.value = pole;
  connectionHistory.value = [pole];
  console.log('开始电线杆连线模式:', pole.levelLogicId);
};

/**
 * 结束连线模式
 */
export const endConnectionMode = () => {
  isConnectionMode.value = false;
  currentConnectionPole.value = null;
  connectionHistory.value = [];
};

/**
 * 连接到目标电线杆
 * @param targetPole 目标电线杆
 * @param showRangeAlert 是否显示距离超出提示（默认为false）
 */
export const connectToPole = async (targetPole: PointData, showRangeAlert: boolean = false): Promise<{ success: boolean; reason?: string }> => {
  if (!isConnectionMode.value || !currentConnectionPole.value) {
    console.log('连接模式未激活或没有起始电线杆');
    return { success: false };
  }

  // 开始新的连接尝试时，先清除之前的失败状态
  if (showRangeAlert) {
    pubsub.publish(EVENTS.CONNECTION_ATTEMPT_START);
  }

  // 检查是否为电线杆
  if (targetPole.entityDataIdKey !== 'electric_pole') {
    if (showRangeAlert) {
      pubsub.publish(EVENTS.SHOW_ALERT, { content: 'electric_pole_connector.connection_failed.not_electric_pole', useI18n: true });
    }
    return { success: false };
  }

  // 检查是否连接到自己
  if (targetPole.levelLogicId === currentConnectionPole.value.levelLogicId) {
    if (showRangeAlert) {
      pubsub.publish(EVENTS.SHOW_ALERT, { content: 'electric_pole_connector.connection_failed.connect_to_self', useI18n: true });
    }
    return { success: false };
  }

  // 检查是否已经连接
  const connectionKey = getConnectionKey(currentConnectionPole.value, targetPole);
  if (connectionLines.value.has(connectionKey)) {
    if (showRangeAlert) {
      pubsub.publish(EVENTS.SHOW_ALERT, { content: 'electric_pole_connector.connection_failed.already_connected', useI18n: true });
    }
    return { success: false };
  }

  // 检查连接数量限制
  const currentConnections = getPoleConnections(currentConnectionPole.value);
  const targetConnections = getPoleConnections(targetPole);

  if (currentConnections >= MAX_CONNECTIONS_PER_POLE) {
    if (showRangeAlert) {
      pubsub.publish(EVENTS.SHOW_ALERT, { content: 'electric_pole_connector.connection_failed.max_connections_source', useI18n: true });
    }
    return { success: false };
  }

  if (targetConnections >= MAX_CONNECTIONS_PER_POLE) {
    if (showRangeAlert) {
      pubsub.publish(EVENTS.SHOW_ALERT, { content: 'electric_pole_connector.connection_failed.max_connections_target', useI18n: true });
    }
    return { success: false };
  }

  // 检查距离
  if (!checkConnectionDistance(currentConnectionPole.value, targetPole)) {
    if (showRangeAlert) {
      pubsub.publish(EVENTS.SHOW_ALERT, { content: 'electric_pole_connector.connection_failed.range_exceeded', useI18n: true });
    }
    return { success: false };
  }

  // 创建连线
  const lineGroupId = connectPoints(
    [currentConnectionPole.value.levelLogicId, targetPole.levelLogicId],
    '#FFFF00',
    2,
    false,
    false
  );

  if (lineGroupId) {
    const startPoleId = currentConnectionPole.value.levelLogicId;
    const endPoleId = targetPole.levelLogicId;

    connectionLines.value.set(connectionKey, lineGroupId);

    // 更新连线历史
    connectionHistory.value.push(targetPole);
    currentConnectionPole.value = targetPole;

    // 保存到存储
    await saveConnectionsToStorage();

    // 发布连接变更事件
    pubsub.publish(EVENTS.POLE_CONNECTION_CHANGED, [startPoleId, endPoleId]);

    // 连接成功后，隐藏任何显示的失败弹窗
    pubsub.publish(EVENTS.CONNECTION_SUCCESS);

    return { success: true };
  }

  return { success: false };
};

/**
 * 检查连接距离
 * @param pole1 电线杆1
 * @param pole2 电线杆2
 */
const checkConnectionDistance = (pole1: PointData, pole2: PointData): boolean => {
  const feature1 = getItemMap()[pole1.levelLogicId];
  const feature2 = getItemMap()[pole2.levelLogicId];

  if (!feature1 || !feature2) {
    return false;
  }

  const coord1 = feature1.getGeometry()?.getCoordinates();
  const coord2 = feature2.getGeometry()?.getCoordinates();

  if (!coord1 || !coord2) {
    return false;
  }

  // 计算地图单位距离（米）
  const distance = Math.sqrt(
    Math.pow(coord1[0] - coord2[0], 2) + Math.pow(coord1[1] - coord2[1], 2)
  );

  return distance <= MAX_CONNECTION_DISTANCE;
};

/**
 * 计算两个电线杆之间的距离
 * @param pole1 电线杆1
 * @param pole2 电线杆2
 * @returns 距离（米），如果无法计算则返回 0
 */
const getDistanceBetweenPoles = (pole1: PointData, pole2: PointData): number => {
  const feature1 = getItemMap()[pole1.levelLogicId];
  const feature2 = getItemMap()[pole2.levelLogicId];

  if (!feature1 || !feature2) {
    return 0;
  }

  const coord1 = feature1.getGeometry()?.getCoordinates();
  const coord2 = feature2.getGeometry()?.getCoordinates();

  if (!coord1 || !coord2) {
    return 0;
  }

  return Math.sqrt(
    Math.pow(coord1[0] - coord2[0], 2) + Math.pow(coord1[1] - coord2[1], 2)
  );
};


/**
 * 获取电线杆的连接数量
 * @param pole 电线杆
 */
export const getPoleConnections = (pole: PointData): number => {
  let count = 0;
  for (const [key] of connectionLines.value) {
    if (key.includes(pole.levelLogicId.toString())) {
      count++;
    }
  }
  return count;
};

/**
 * 获取电线杆的最大连接距离
 * @param pole 电线杆
 * @returns 最大连接距离，如果没有连接则返回 0
 */
export const getPoleMaxConnectionDistance = (pole: PointData): number => {
  console.log('------------------------------------');
  console.log(`开始为电线杆 ${pole.levelLogicId} 计算最大连接距离`);
  console.log('当前所有连接:', connectionLines.value);

  let maxDistance = 0;
  const poleId = pole.levelLogicId.toString();

  for (const [key] of connectionLines.value) {
    console.log(`检查连接key: "${key}" 是否包含 poleId: "${poleId}"`);
    if (key.includes(poleId)) {
      console.log(`  -> 包含!`);
      const poleIds = key.split('___');
      const otherPoleId = poleIds[0] === poleId ? poleIds[1] : poleIds[0];
      console.log(`  -> 另一个电线杆ID是: ${otherPoleId}`);

      const itemMap = getItemMap();
      const otherPoleFeature = itemMap[otherPoleId];

      if (otherPoleFeature) {
        console.log(`  -> 在 itemMap 中找到了另一个电线杆的Feature`);
        const otherPoleData = otherPoleFeature.get('payload') as PointData;
        const distance = getDistanceBetweenPoles(pole, otherPoleData);
        console.log(`  -> 计算出的距离是: ${distance}`);
        if (distance > maxDistance) {
          maxDistance = distance;
        }
      } else {
        console.warn(`  -> 在 itemMap 中未找到ID为 ${otherPoleId} 的电线杆Feature!`);
      }
    } else {
      console.log(`  -> 不包含。`);
    }
  }
  console.log(`电线杆 ${poleId} 的最终最大连接距离: ${maxDistance}`);
  console.log('------------------------------------');
  return maxDistance;
};


/**
 * 生成连接键
 * @param pole1 电线杆1
 * @param pole2 电线杆2
 */
const getConnectionKey = (pole1: PointData, pole2: PointData): string => {
  const ids = [pole1.levelLogicId, pole2.levelLogicId].sort();
  return ids.join('___');
};

/**
 * 删除与指定标点相关的所有连线
 * @param levelLogicId 标点ID
 */
export const removeConnectionsForPoint = async (levelLogicId: string | number): Promise<void> => {
  const idStr = levelLogicId.toString();
  const connectionsToRemove: string[] = [];

  // 找到所有包含该标点的连线
  for (const [connectionKey, lineGroupId] of connectionLines.value) {
    if (connectionKey.includes(idStr)) {
      connectionsToRemove.push(lineGroupId);
    }
  }

  // 删除所有相关连线
  for (const lineGroupId of connectionsToRemove) {
    await removeConnection(lineGroupId);
  }

  console.log(`删除了 ${connectionsToRemove.length} 条与标点 ${idStr} 相关的连线`);
};

/**
 * 删除连接
 * @param lineGroupId 连线组ID
 */
export const removeConnection = async (lineGroupId: string): Promise<boolean> => {
  // 找到对应的连接键
  let connectionKey = '';
  for (const [key, value] of connectionLines.value) {
    if (value === lineGroupId) {
      connectionKey = key;
      break;
    }
  }

  if (connectionKey) {
    const poleIds = connectionKey.split('___');
    connectionLines.value.delete(connectionKey);
    // 保存到存储
    await saveConnectionsToStorage();

    // 发布连接变更事件
    pubsub.publish(EVENTS.POLE_CONNECTION_CHANGED, poleIds);
  }

  return removeLineGroup(lineGroupId);
};

/**
 * 获取所有连接
 */
export const getAllConnections = () => {
  return Array.from(connectionLines.value.entries()).map(([key, lineGroupId]) => ({
    poles: key.split('___'),
    lineGroupId,
  }));
};

/**
 * 检查是否在连线模式
 */
export const isInConnectionMode = computed(() => isConnectionMode.value);

/**
 * 获取当前连接的电线杆
 */
export const getCurrentConnectionPole = computed(() => currentConnectionPole.value);

/**
 * 获取连接历史
 */
export const getConnectionHistory = computed(() => connectionHistory.value);

/**
 * 检查两个电线杆是否已连接
 * @param pole1 电线杆1
 * @param pole2 电线杆2
 */
export const isPolesConnected = (pole1: PointData, pole2: PointData): boolean => {
  const connectionKey = getConnectionKey(pole1, pole2);
  return connectionLines.value.has(connectionKey);
};

// 连线数据存储类型
interface StoredConnection {
  poles: (string | number)[];
  color: string;
  width: number;
  dashed: boolean;
}

/**
 * 保存连线数据到存储
 */
const saveConnectionsToStorage = async (): Promise<void> => {
  const connections: StoredConnection[] = [];
  for (const [key, lineGroupId] of connectionLines.value) {
    const lineGroup = lineGroups[lineGroupId];
    if (lineGroup) {
      const poleIds = key.split('___');
      connections.push({
        poles: poleIds as (string | number)[],
        color: '#FFFF00', // 默认颜色
        width: 2, // 默认宽度
        dashed: false, // 默认实线
      });
    }
  }

  await setItem(DATA_DB_KEY.ELECTRIC_POLE_CONNECTIONS, connections, StorageType.PERMANENT);
};

/**
 * 从存储中恢复连线数据
 */
export const restoreConnectionsFromStorage = async (): Promise<void> => {
  const storedConnections = await getItem<StoredConnection[]>(
    DATA_DB_KEY.ELECTRIC_POLE_CONNECTIONS,
    StorageType.PERMANENT
  );

  if (storedConnections && storedConnections.length > 0) {
    for (const connection of storedConnections) {
      // 使用默认值处理缺失的属性（向后兼容）
      const color = (connection as any).color || '#FFFF00';
      const width = (connection as any).width || 2;
      const dashed = (connection as any).dashed || false;

      const lineGroupId = connectPoints(
        connection.poles,
        color,
        width,
        dashed,
        false
      );

      if (lineGroupId) {
        const pole1 = { levelLogicId: connection.poles[0] } as PointData;
        const pole2 = { levelLogicId: connection.poles[1] } as PointData;
        const connectionKey = getConnectionKey(pole1, pole2);
        connectionLines.value.set(connectionKey, lineGroupId);
      }
    }
    // 恢复连接后，通知所有相关电线杆更新范围
    const allPoleIds = new Set<string | number>();
    storedConnections.forEach(conn => {
      conn.poles.forEach(id => allPoleIds.add(id));
    });
    pubsub.publish(EVENTS.POLE_CONNECTION_CHANGED, Array.from(allPoleIds));
    console.log('从存储中恢复了电线杆连接，并发布了更新事件', Array.from(allPoleIds));
  }
};

// 订阅选择变更事件，以控制连线可见性
pubsub.subscribe(EVENTS.SELECT_CHANGE, () => {
  const electricPoleVisible = entityShowStates['electric_pole'];
  for (const lineGroupId in lineGroups) {
    const lineGroup = lineGroups[lineGroupId];
    if (lineGroup) {
      lineGroup.layer.setVisible(electricPoleVisible);
    }
  }
});

/**
 * 清空所有连线数据
 */
export const clearAllConnections = async (): Promise<void> => {
  // 清除地图上的连线
  for (const lineGroupId of connectionLines.value.values()) {
    removeLineGroup(lineGroupId);
  }

  const allPoleIds = new Set<string | number>();
  for (const key of connectionLines.value.keys()) {
    key.split('___').forEach(id => allPoleIds.add(id));
  }

  // 清除内存中的数据
  connectionLines.value.clear();

  // 清除存储
  await setItem(DATA_DB_KEY.ELECTRIC_POLE_CONNECTIONS, [], StorageType.PERMANENT);

  // 发布连接变更事件
  if (allPoleIds.size > 0) {
    pubsub.publish(EVENTS.POLE_CONNECTION_CHANGED, Array.from(allPoleIds));
    console.log('清空了所有电线杆连接，并发布了更新事件', Array.from(allPoleIds));
  }
};
