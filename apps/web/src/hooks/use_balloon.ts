import type { BalloonLift, BalloonSolveResult, ParsedBalloonLevel } from '@endfieldmap/map-service';
import { logger } from '@endfieldmap/tools';
import { useCallback, useEffect, useRef, useState } from 'react';

import { BALLOON_MAX_SOLUTIONS, BalloonStatus } from '@/const/balloon';
import { service } from '@/services';

export const useBalloon = ({ levelList: levelListProp }: { levelList?: string[] }) => {
  // 标点自带 subMinigameIds 时用它；缺失时回退到全量官方关卡清单供手动选择
  const levelList =
    levelListProp && levelListProp.length > 0 ? levelListProp : service.dataService.balloonService.LEVEL_IDS;
  const [selectedLevel, _setSelectedLevel] = useState<string>('');
  const [levelData, setLevelData] = useState<ParsedBalloonLevel | null>(null);
  const [result, setResult] = useState<BalloonSolveResult | null>(null);
  const [solutionIndex, setSolutionIndex] = useState<number>(0);
  const [status, setStatus] = useState<BalloonStatus>(BalloonStatus.Idle);
  const [solvingTime, setSolvingTime] = useState<number>(-1);
  const solveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // 加载关卡数据
  const loadLevel = useCallback(async (level: string) => {
    try {
      // 换关时丢弃待决的求解任务，避免旧关的解写到新关状态上
      if (solveTimerRef.current) clearTimeout(solveTimerRef.current);
      setStatus(BalloonStatus.Loading);
      setResult(null);
      setSolutionIndex(0);
      setLevelData(null);

      const parsed = await service.dataService.balloonService.getLevelData(level);

      if (!parsed) {
        setStatus(BalloonStatus.LoadingError);
        return;
      }

      setLevelData(parsed);
      setStatus(BalloonStatus.LoadingSuccess);
    } catch (error) {
      logger.error('加载浮空回收关卡失败:', error);
      setStatus(BalloonStatus.LoadingError);
    }
  }, []);

  const selectLevel = useCallback(
    (level: string) => {
      _setSelectedLevel(level);
      loadLevel(level);
    },
    [loadLevel]
  );

  useEffect(() => {
    if (levelList.length > 0) queueMicrotask(() => selectLevel(levelList[0]));
  }, [levelList, selectLevel]);

  useEffect(() => {
    return () => {
      if (solveTimerRef.current) clearTimeout(solveTimerRef.current);
    };
  }, []);

  // 求解
  const handleSolve = () => {
    if (!levelData) {
      return;
    }

    setStatus(BalloonStatus.Solving);

    // 使用 setTimeout 避免阻塞 UI
    solveTimerRef.current = setTimeout(() => {
      try {
        const startTime = performance.now();
        const solved = service.dataService.balloonService.solveLevel(levelData, {
          maxSolutions: BALLOON_MAX_SOLUTIONS,
        });
        const endTime = performance.now();

        setResult(solved);
        setSolutionIndex(0);
        setStatus(solved.solutions.length > 0 ? BalloonStatus.SolvingSuccess : BalloonStatus.SolvingError);
        setSolvingTime(endTime - startTime);
      } catch (error) {
        logger.error('求解出错:', error);
        setResult(null);
        setStatus(BalloonStatus.SolvingError);
      }
    }, 100);
  };

  // 获取浮力颜色
  const getLiftColor = (lift: BalloonLift): string => {
    return service.dataService.balloonService.LIFT_COLOR_MAP[lift] || '#3CAAFF';
  };

  return {
    levelList,
    selectedLevel,
    selectLevel,
    levelData,
    result,
    solutionIndex,
    setSolutionIndex,
    status,
    solvingTime,
    loadLevel,
    handleSolve,
    getLiftColor,
  };
};
