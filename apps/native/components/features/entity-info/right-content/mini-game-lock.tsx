import type { Grid, ParsedLevel } from '@endfieldmap/map-service';
import { cn } from '@endfieldmap/tools';
import { logger } from '@endfieldmap/tools';
import React, { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { service } from '@/services/map-service';

import { SubPopupTitle } from './sub-popup-title';
import type { MiniGameLockData } from './types';

enum DeltaRobotStatus {
  Idle,
  Loading,
  LoadingError,
  LoadingSuccess,
  Solving,
  SolvingError,
  SolvingSuccess,
}

function useDeltaRobot({ levelList }: { levelList: string[] }) {
  const [selectedLevel, _setSelectedLevel] = useState('');
  const [levelData, setLevelData] = useState<ParsedLevel | null>(null);
  const [solutionGrid, setSolutionGrid] = useState<Grid | null>(null);
  const [status, setStatus] = useState(DeltaRobotStatus.Idle);

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
    [loadLevel],
  );

  useEffect(() => {
    if (levelList.length > 0) selectLevel(levelList[0]);
  }, [levelList, selectLevel]);

  const handleSolve = useCallback(() => {
    if (!levelData || levelData.pieces.length === 0) return;

    setStatus(DeltaRobotStatus.Solving);

    setTimeout(() => {
      try {
        const { sizeX, sizeY, obstaclesFlat, pieces, rowConstraints, colConstraints, groups } = levelData;

        const obstaclesMap = Array.from({ length: sizeY }, (_, r) =>
          Array.from({ length: sizeX }, (_, c) => {
            const idx = r * sizeX + c;
            return obstaclesFlat[idx] || null;
          }),
        );

        const pieceShapes = pieces.map((p) => p.shape);
        const pieceGroupIds = pieces.map((p) => p.groupId);

        const result = service.dataService.deltaRobotService.solvePuzzle(
          sizeY,
          sizeX,
          rowConstraints,
          colConstraints,
          pieceShapes,
          pieceGroupIds,
          groups.length,
          obstaclesMap,
        );

        if (result) {
          setSolutionGrid(result);
          setStatus(DeltaRobotStatus.SolvingSuccess);
        } else {
          setStatus(DeltaRobotStatus.SolvingError);
        }
      } catch (error) {
        logger.error('求解出错:', error);
        setStatus(DeltaRobotStatus.SolvingError);
      }
    }, 100);
  }, [levelData]);

  const getGroupColor = useCallback(
    (groupId: number): string => {
      return levelData?.groups[groupId]?.color || '#3CAAFF';
    },
    [levelData],
  );

  return { levelList, selectedLevel, selectLevel, levelData, solutionGrid, status, handleSolve, getGroupColor };
}

const CELL_SIZE = 20;

function SolutionGrid({
  grid,
  levelData,
  getGroupColor,
}: {
  grid: Grid;
  levelData: ParsedLevel | null;
  getGroupColor: (id: number) => string;
}) {
  if (!levelData) return null;
  const rows = grid.length;
  const cols = grid[0]?.length ?? 0;

  return (
    <View className="items-center py-2">
      {Array.from({ length: rows }, (_, r) => (
        <View key={r} className="flex-row">
          {Array.from({ length: cols }, (_, c) => {
            const val = grid[r][c];
            const piece = val >= 0 ? levelData.pieces[val] : null;
            const color = piece ? getGroupColor(piece.groupId) : 'transparent';
            return (
              <View
                key={c}
                style={{
                  width: CELL_SIZE,
                  height: CELL_SIZE,
                  backgroundColor: val >= 0 ? color : 'transparent',
                  borderWidth: 0.5,
                  borderColor: val >= 0 ? 'rgba(255,255,255,0.2)' : 'rgba(255,255,255,0.05)',
                }}
              />
            );
          })}
        </View>
      ))}
    </View>
  );
}

interface MiniGameLockComponentProps {
  prop: MiniGameLockData;
}

export function MiniGameLockComponent({ prop }: MiniGameLockComponentProps) {
  const { miniGameIds } = prop;
  const { t } = useTranslation(['popup', 'lang']);

  const { levelList, selectedLevel, selectLevel, levelData, solutionGrid, status, handleSolve, getGroupColor } =
    useDeltaRobot({ levelList: miniGameIds });

  const solving = status === DeltaRobotStatus.Solving;

  return (
    <View>
      <SubPopupTitle>
        {t('popup:robot.solution', { defaultValue: '拼图解谜' })}
      </SubPopupTitle>

      <View className="px-4 py-3">
        <Text className="mb-2 text-xs text-text-muted">
          {t('popup:robot.level_selection', {
            levels: levelList.length,
            defaultValue: `关卡选择 (${levelList.length} 个)`,
          })}
        </Text>

        <View className="mb-3 flex-row flex-wrap gap-2">
          {levelList.map((id, index) => (
            <Pressable
              key={id}
              className={cn(
                'rounded-lg border px-3 py-1.5',
                selectedLevel === id ? 'border-primary bg-primary/10' : 'border-border bg-bg-tertiary',
              )}
              onPress={() => selectLevel(id)}
            >
              <Text
                className={cn(
                  'text-sm',
                  selectedLevel === id ? 'font-semibold text-primary' : 'text-text-secondary',
                )}
              >
                {t('popup:robot.level_item', {
                  level: index + 1,
                  defaultValue: `关卡 ${index + 1}`,
                })}
              </Text>
            </Pressable>
          ))}
        </View>

        {levelData && (
          <Text className="mb-2 text-xs text-text-muted">
            {t('popup:robot.puzzle_piece_count', {
              pieces: levelData.pieces.length,
              defaultValue: `拼图块: ${levelData.pieces.length} 个`,
            })}
          </Text>
        )}

        <Pressable
          className={cn(
            'items-center rounded-lg py-3',
            !levelData || levelData.pieces.length === 0 || solving ? 'bg-bg-tertiary' : 'bg-primary',
          )}
          onPress={handleSolve}
          disabled={!levelData || levelData.pieces.length === 0 || solving}
        >
          {solving ? (
            <View className="flex-row items-center gap-2">
              <ActivityIndicator size="small" color="#fff" />
              <Text className="text-sm font-semibold text-white">
                {t('popup:robot.solving', { defaultValue: '求解中...' })}
              </Text>
            </View>
          ) : (
            <Text
              className={cn(
                'text-sm font-semibold',
                !levelData || levelData.pieces.length === 0 ? 'text-text-muted' : 'text-white',
              )}
            >
              {t('popup:robot.start_solve', { defaultValue: '开始求解' })}
            </Text>
          )}
        </Pressable>

        <View className="mt-3 items-center overflow-hidden rounded-lg bg-bg-tertiary">
          <View className="flex-row items-center gap-1 p-1">
            <View
              className={cn('h-2 w-2 rounded-full', {
                'bg-green-500/50': status === DeltaRobotStatus.SolvingSuccess,
                'bg-red-500/50': status === DeltaRobotStatus.SolvingError,
                'bg-blue-500/50': status === DeltaRobotStatus.Solving,
              })}
            />
          </View>
          {status === DeltaRobotStatus.SolvingSuccess && solutionGrid && (
            <SolutionGrid grid={solutionGrid} levelData={levelData} getGroupColor={getGroupColor} />
          )}
        </View>
      </View>
    </View>
  );
}
