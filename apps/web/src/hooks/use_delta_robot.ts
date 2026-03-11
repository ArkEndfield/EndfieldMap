import type { Grid, ParsedLevel } from '@endfieldmap/map-service';
import { logger } from '@endfieldmap/tools';
import { useCallback, useEffect, useRef, useState } from 'react';

import { DeltaRobotStatus } from '@/const/delta_robot';
import { service } from '@/services';

export const useDeltaRobot = ({ levelList }: { levelList: string[] }) => {
  const [selectedLevel, _setSelectedLevel] = useState<string>('');
  const [levelData, setLevelData] = useState<ParsedLevel | null>(null);
  const [solutionGrid, setSolutionGrid] = useState<Grid | null>(null);
  const [status, setStatus] = useState<DeltaRobotStatus>(DeltaRobotStatus.Idle);
  const [solvingTime, setSolvingTime] = useState<number>(-1);
  const solveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // 加载关卡数据
  const loadLevel = useCallback(async (level: string) => {
    try {
      setStatus(DeltaRobotStatus.Loading);
      setSolutionGrid(null);
      setLevelData(null);

      const parsed = await service.dataService.deltaRobotService.getLevelData(level);

      if (!parsed) {
        setStatus(DeltaRobotStatus.LoadingError);
        return;
      }

      // 更新状态
      setLevelData(parsed);
      setStatus(DeltaRobotStatus.LoadingSuccess);
    } catch (error) {
      logger.error('加载关卡失败:', error);
      setStatus(DeltaRobotStatus.LoadingError);
    }
  }, []);

  const selectLevel = useCallback(
    (level: string) => {
      _setSelectedLevel(level);
      loadLevel(level);
    },
    [loadLevel, _setSelectedLevel]
  );

  useEffect(() => {
    if (levelList.length > 0) selectLevel(levelList[0]);
  }, [levelList, selectLevel]);

  useEffect(() => {
    return () => {
      if (solveTimerRef.current) clearTimeout(solveTimerRef.current);
    };
  }, []);

  // 求解拼图
  const handleSolve = () => {
    if (!levelData || levelData.pieces.length === 0) {
      return;
    }

    setStatus(DeltaRobotStatus.Solving);

    // 使用 setTimeout 避免阻塞 UI
    solveTimerRef.current = setTimeout(() => {
      try {
        const { sizeX, sizeY, obstaclesFlat, pieces, rowConstraints, colConstraints, groups } = levelData;

        // 准备障碍物二维数组
        const obstaclesMap = Array.from({ length: sizeY }, (_, r) =>
          Array.from({ length: sizeX }, (_, c) => {
            const idx = r * sizeX + c;
            return obstaclesFlat[idx] || null;
          })
        );

        // 准备拼图数据
        const pieceShapes = pieces.map((p) => p.shape);
        const pieceGroupIds = pieces.map((p) => p.groupId);

        // 调用求解器
        const startTime = performance.now();
        const result = service.dataService.deltaRobotService.solvePuzzle(
          sizeY,
          sizeX,
          rowConstraints,
          colConstraints,
          pieceShapes,
          pieceGroupIds,
          groups.length,
          obstaclesMap
        );
        const endTime = performance.now();

        if (result) {
          setSolutionGrid(result);
          setStatus(DeltaRobotStatus.SolvingSuccess);
          setSolvingTime(endTime - startTime);
        } else {
          setStatus(DeltaRobotStatus.SolvingError);
        }
      } catch (error) {
        logger.error('求解出错:', error);
        setStatus(DeltaRobotStatus.SolvingError);
      }
    }, 100);
  };

  // 获取分组颜色
  const getGroupColor = (groupId: number): string => {
    return levelData?.groups[groupId]?.color || '#3CAAFF';
  };

  // 获取分组边框颜色 - 增强亮度以实现高亮效果
  const getGroupBorderColor = (groupId: number): string => {
    const baseColor = getGroupColor(groupId);
    return adjustColorBrightness(baseColor, 40);
  };

  // 调整颜色亮度的辅助函数
  const adjustColorBrightness = (hexColor: string, percent: number): string => {
    const num = parseInt(hexColor.replace('#', ''), 16);
    const amt = Math.round(2.55 * percent);
    const R = Math.min(255, (num >> 16) + amt);
    const G = Math.min(255, ((num >> 8) & 0x00ff) + amt);
    const B = Math.min(255, (num & 0x0000ff) + amt);
    return `#${((1 << 24) | (R << 16) | (G << 8) | B).toString(16).slice(1)}`;
  };

  // 获取分组名称
  const getGroupName = (groupId: number): string => {
    return levelData?.groups[groupId]?.name || 'Unknown';
  };

  return {
    levelList,
    selectedLevel,
    selectLevel,
    levelData,
    solutionGrid,
    status,
    solvingTime,
    loadLevel,
    handleSolve,
    getGroupColor,
    getGroupBorderColor,
    getGroupName,
  };
};
