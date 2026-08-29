import type { PieceUI } from '@endfieldmap/map-service';
import { cn } from '@endfieldmap/tools';
import { useTranslation } from 'react-i18next';

export const DeltaRobotPiece = ({
  data,
  getGroupColor,
}: {
  data: PieceUI[];
  getGroupColor: (groupId: number) => string;
}) => {
  const { t } = useTranslation('popup');

  return (
    <div
      className={cn(
        'max-h-40 overflow-y-auto grid gap-2 bg-[#1a1a1a] p-2 rounded',
        data.length < 4 ? 'grid-cols-3' : 'grid-cols-4'
      )}
    >
      {data.length === 0 ? (
        <div className="col-span-3 text-center text-gray-400 py-4">{t('robot.no_puzzle_piece')}</div>
      ) : (
        data.map((piece) => (
          <div
            key={piece.id}
            className="flex items-center justify-center p-2 bg-[#2a2a2a] rounded hover:bg-[#333333] transition-colors"
            style={{
              border: `2px solid rgba(255,255,255,0.5)`,
            }}
          >
            {/* 拼图缩略图 */}
            <div className="flex flex-col gap-px">
              {piece.shape.map((row, r) => (
                <div key={r} className="flex gap-px">
                  {row.map((val, c) => (
                    <div
                      key={c}
                      className="w-3 h-3"
                      style={{
                        backgroundColor: val === 1 ? getGroupColor(piece.groupId) : 'transparent',
                      }}
                    />
                  ))}
                </div>
              ))}
            </div>
          </div>
        ))
      )}
    </div>
  );
};
