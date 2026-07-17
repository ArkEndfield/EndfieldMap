import { BALLOON_LIFT_TYPES } from '@endfieldmap/map-service';
import { cn } from '@endfieldmap/tools';
import { EndfieldSelect, TickCircleIcon, ZmdSquareButton } from '@endfieldmap/web-components';
import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';

import { BalloonInventory } from '@/components/common/balloon/inventory';
import { BalloonSolutionGrid } from '@/components/common/balloon/solution';
import { SubPopupTitle } from '@/components/common/popup/components/title';
import type { MinigameBalloonSystemComponent } from '@/components/common/popup/sub/components/types';
import type { SubPopupComponentProps } from '@/components/common/popup/sub/types';
import { BalloonStatus } from '@/const/balloon';
import { useBalloon } from '@/hooks/use_balloon';

const BalloonMiniGameComponent: SubPopupComponentProps<MinigameBalloonSystemComponent> = ({ prop }) => {
  const { system_inst_key, subMinigameIds } = prop;
  const { t } = useTranslation(['popup', 'lang']);

  // system_inst_key 固定是该标点的第一关；有多关时后续关卡放在 subMinigameIds。
  // 两者都缺才回退全量清单手动选择
  const markerLevelIds = useMemo(() => {
    const ids = [...(system_inst_key ? [system_inst_key] : []), ...(subMinigameIds ?? [])];
    return ids.length > 0 ? ids : undefined;
  }, [subMinigameIds, system_inst_key]);
  const usingManualList = !markerLevelIds;

  const {
    levelList,
    selectedLevel,
    selectLevel,
    levelData,
    result,
    solutionIndex,
    setSolutionIndex,
    status,
    handleSolve,
    getLiftColor,
  } = useBalloon({ levelList: markerLevelIds });

  const solving = status === BalloonStatus.Solving;
  const totalBalloons = levelData
    ? BALLOON_LIFT_TYPES.reduce((sum, lift) => sum + levelData.balloonConfig[lift], 0)
    : 0;
  const solutions = result?.solutions ?? [];
  const shownPlacement = status === BalloonStatus.SolvingSuccess ? (solutions[solutionIndex] ?? null) : null;

  return (
    <>
      {/* 标题行：右侧内嵌关卡选择 */}
      <div className="sticky top-0 z-3">
        <SubPopupTitle className="static">{t('popup:balloon.solution')}</SubPopupTitle>
        <div className="absolute right-2 top-1/2 -translate-y-1/2 w-24">
          <EndfieldSelect
            value={selectedLevel}
            options={levelList.map((id, index) => ({
              value: id,
              label: usingManualList
                ? t('popup:balloon.level_item', { id })
                : t('popup:balloon.level_index', { level: index + 1 }),
            }))}
            onChange={(val) => selectLevel(val)}
            classNames={{ trigger: 'py-1.5 text-xs' }}
          />
        </div>
      </div>
      <div className="px-4 pt-4 space-y-2 text-gray-300">
        {/* 气球库存 */}
        {levelData && (
          <>
            <label className="text-xs">{t('popup:balloon.balloon_count', { amount: totalBalloons })}</label>
            <BalloonInventory counts={levelData.balloonConfig} getLiftColor={getLiftColor} />
          </>
        )}

        {/* 求解按钮：求解完成后隐藏，换关后恢复 */}
        {!result && (
          <ZmdSquareButton
            className="w-full text-base"
            classNames={{
              icon: 'text-base w-4 h-4',
            }}
            onClick={handleSolve}
            disabled={!levelData || totalBalloons === 0}
            loading={solving}
            icon={<TickCircleIcon />}
          >
            {solving ? t('popup:balloon.solving') : t('popup:balloon.start_solve')}
          </ZmdSquareButton>
        )}

        {/* 求解结果棋盘 */}
        <div className={cn('bg-[#1a1a1a] rounded overflow-hidden w-full', 'mt-4 relative', 'flex justify-center')}>
          <div
            className={cn('h-2 w-2 rounded-full absolute top-1 left-1 z-1', {
              'bg-green-900/50': status === BalloonStatus.SolvingSuccess,
              'bg-red-900/50': status === BalloonStatus.SolvingError,
              'bg-blue-900/50': status === BalloonStatus.Solving,
            })}
          />
          {/* 关卡棋盘默认绘制：载入即画空盘，求解成功后画解 */}
          {levelData && !(status === BalloonStatus.SolvingError && result) && (
            <BalloonSolutionGrid
              placement={shownPlacement}
              levelData={levelData}
              getLiftColor={getLiftColor}
              className="w-54 h-54"
            />
          )}
          {status === BalloonStatus.SolvingError && result && (
            <div className="text-xs text-red-400/80 py-8">{t('popup:balloon.no_solution')}</div>
          )}
        </div>

        {/* 多解导航 */}
        {status === BalloonStatus.SolvingSuccess && solutions.length > 0 && (
          <div className="flex items-center justify-between text-xs text-gray-400 pb-4">
            <button
              type="button"
              className="px-2 py-0.5 bg-[#2a2a2a] rounded hover:bg-[#333333] disabled:opacity-40 transition-colors"
              disabled={solutionIndex <= 0}
              onClick={() => setSolutionIndex(solutionIndex - 1)}
            >
              ‹
            </button>
            <span>
              {t('popup:balloon.solution_nav', {
                index: solutionIndex + 1,
                total: `${solutions.length}${result?.truncated ? '+' : ''}`,
              })}
            </span>
            <button
              type="button"
              className="px-2 py-0.5 bg-[#2a2a2a] rounded hover:bg-[#333333] disabled:opacity-40 transition-colors"
              disabled={solutionIndex >= solutions.length - 1}
              onClick={() => setSolutionIndex(solutionIndex + 1)}
            >
              ›
            </button>
          </div>
        )}
      </div>
    </>
  );
};

export default BalloonMiniGameComponent;
