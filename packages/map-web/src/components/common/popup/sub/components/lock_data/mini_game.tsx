import type { MiniGameLockData } from '@/components/common/popup/sub/components/lock_data/types';
import type { SubPopupComponentProps } from '@/components/common/popup/sub/types';
import { SubPopupTitle } from '@/components/common/popup/components/title';
import { useTranslation } from 'react-i18next';

import { DeltaRobotPiece } from '@/components/common/delta_robot/piece';
import { DeltaRobotSolutionGrid } from '@/components/common/delta_robot/solution';
import { ZmdSquareButton } from '@/components/common/endfield_components/button/square_button';
import { EndfieldSelect } from '@/components/common/endfield_components/form/select';
import { TickCircleIcon } from '@/components/common/icons';
import { DeltaRobotStatus } from '@/const/delta_robot';
import { useDeltaRobot } from '@/hooks/use_delta_robot';
import { cn } from '@/utils/style';

export const MiniGameLockComponent: SubPopupComponentProps<MiniGameLockData> = ({ prop }) => {
  const { miniGameIds } = prop;
  const { t } = useTranslation(['popup', 'lang']);

  const { levelList, selectedLevel, setSelectedLevel, levelData, solutionGrid, status, handleSolve, getGroupColor } =
    useDeltaRobot({ levelList: miniGameIds });

  const solving = status === DeltaRobotStatus.Solving;

  return (
    <>
      <SubPopupTitle>{t('popup:robot.solution')}</SubPopupTitle>
      {/* 关卡选择 */}
      <div className="px-4 pt-4 space-y-2 text-gray-300">
        <label className="block text-xs">{t('popup:robot.level_selection', { levels: levelList.length })}</label>
        <EndfieldSelect
          value={selectedLevel}
          options={levelList.map((id, index) => ({
            value: id,
            label: t('popup:robot.level_item', { level: index + 1 }),
          }))}
          onChange={(val) => setSelectedLevel(val)}
          className="w-full"
        />
        {/* 库存列表 */}
        {levelData && (
          <>
            <label className="text-xs">
              {t('popup:robot.puzzle_piece_count', { pieces: levelData.pieces.length })}
            </label>
            <DeltaRobotPiece data={levelData.pieces} getGroupColor={getGroupColor} />
          </>
        )}

        {/* 求解按钮 */}
        <ZmdSquareButton
          className="w-full text-base"
          classNames={{
            icon: 'text-base w-4 h-4',
          }}
          onClick={handleSolve}
          disabled={!levelData || levelData.pieces.length === 0}
          icon={
            solving ? (
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
            ) : (
              <TickCircleIcon />
            )
          }
        >
          {solving ? t('popup:robot.solving') : t('popup:robot.start_slove')}
        </ZmdSquareButton>

        {/* 求解结果网格 */}
        <div className={cn('bg-[#1a1a1a] rounded overflow-hidden w-full', 'mt-4 relative', 'flex justify-center')}>
          <div
            className={cn('h-2 w-2 rounded-full absolute top-1 left-1 z-1', {
              'bg-green-900/50': status === DeltaRobotStatus.SolvingSuccess,
              'bg-red-900/50': status === DeltaRobotStatus.SolvingError,
              'bg-blue-900/50': status === DeltaRobotStatus.Solving,
            })}
          />
          {status === DeltaRobotStatus.SolvingSuccess && (
            <DeltaRobotSolutionGrid
              solutionGrid={solutionGrid}
              levelData={levelData}
              getGroupColor={getGroupColor}
              className="w-54 h-54"
            />
          )}
        </div>
      </div>
    </>
  );
};
