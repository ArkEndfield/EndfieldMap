import { useCallback, useEffect, useState } from 'react';

import type { Grid, ParsedLevel } from '@/@types/delta_robot';
import { useAdapter } from '@/hooks/use_adapter';
import { solvePuzzle } from '@/services/delta_robot/solver';

interface UseDeltaRobotProps {
  levelLogicId: string | number;
}

export const useDeltaRobot = ({ levelLogicId }: UseDeltaRobotProps) => {
  const { dataService } = useAdapter();
  const levelList = dataService.deltaRobotDataService.getLevelList(levelLogicId) || [];

  // 状态管理
  const [selectedLevel, setSelectedLevel] = useState<string>(levelList[0] || '');
  const [levelData, setLevelData] = useState<ParsedLevel | null>(null);
  const [solutionGrid, setSolutionGrid] = useState<Grid | null>(null);
  const [solving, setSolving] = useState<boolean>(false);
  const [statusMessage, setStatusMessage] = useState<string>('');

  // 加载关卡数据
  const loadLevel = useCallback(
    async (levelId: string) => {
      try {
        setStatusMessage('加载关卡数据中...');
        setSolutionGrid(null);
        setLevelData(null); // Clear previous data while loading

        const parsed = await dataService.deltaRobotDataService.getLevelData(levelId);

        if (!parsed) throw new Error('关卡数据加载失败');

        // 更新状态
        setLevelData(parsed);
        setStatusMessage('关卡加载成功！');
      } catch (error) {
        console.error('加载关卡失败:', error);
        setStatusMessage('关卡加载失败，请重试');
      }
    },
    [dataService]
  );

  // 初始加载
  useEffect(() => {
    if (selectedLevel) {
      loadLevel(selectedLevel);
    }
  }, [selectedLevel, loadLevel]);

  // 求解拼图
  const handleSolve = useCallback(() => {
    if (!levelData || levelData.pieces.length === 0) {
      setStatusMessage('没有可用的拼图块');
      return;
    }

    setSolving(true);
    setStatusMessage('正在求解...');

    // 使用 setTimeout 避免阻塞 UI
    setTimeout(() => {
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
        const result = solvePuzzle(
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
          setStatusMessage(`求解成功！耗时 ${(endTime - startTime).toFixed(2)}ms`);
        } else {
          setStatusMessage('求解失败：无解或约束冲突');
        }
      } catch (error) {
        console.error('求解出错:', error);
        setStatusMessage('求解出错，请检查数据');
      } finally {
        setSolving(false);
      }
    }, 100);
  }, [levelData]);

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
    const G = Math.min(255, ((num >> 8) & 0x00FF) + amt);
    const B = Math.min(255, (num & 0x0000FF) + amt);
    return `#${(1 << 24 | R << 16 | G << 8 | B).toString(16).slice(1)}`;
  };

  // 获取分组名称
  const getGroupName = (groupId: number): string => {
    return levelData?.groups[groupId]?.name || 'Unknown';
  };

  return {
    levelList,
    selectedLevel,
    setSelectedLevel,
    levelData,
    solutionGrid,
    solving,
    statusMessage,
    loadLevel,
    handleSolve,
    getGroupColor,
    getGroupBorderColor,
    getGroupName,
  };
};
