import type { BalloonCounts, BalloonLift } from '@endfieldmap/map-service';
import { BALLOON_LIFT_TYPES } from '@endfieldmap/map-service';
import { useTranslation } from 'react-i18next';

/** 库存条：每种浮力一张卡片，游戏内按浮力从大到小排列（BLOCK_STATE_SORT） */
export const BalloonInventory = ({
  counts,
  getLiftColor,
}: {
  counts: BalloonCounts;
  getLiftColor: (lift: BalloonLift) => string;
}) => {
  const { t } = useTranslation('popup');

  const liftsDesc = [...BALLOON_LIFT_TYPES].sort((a, b) => b - a).filter((lift) => counts[lift] > 0);

  return (
    <div className="grid grid-cols-4 gap-2 bg-[#1a1a1a] p-2 rounded">
      {liftsDesc.length === 0 ? (
        <div className="col-span-4 text-center text-gray-400 py-4">{t('balloon.no_balloon')}</div>
      ) : (
        liftsDesc.map((lift) => (
          <div
            key={lift}
            className="flex items-center justify-center gap-1 p-2 bg-[#2a2a2a] rounded hover:bg-[#333333] transition-colors"
          >
            <span
              className="flex items-center justify-center w-5 h-5 rounded-full text-[10px] font-bold text-black/80"
              style={{ backgroundColor: getLiftColor(lift) }}
            >
              {lift}
            </span>
            <span className="text-xs text-gray-300">×{counts[lift]}</span>
          </div>
        ))
      )}
    </div>
  );
};
