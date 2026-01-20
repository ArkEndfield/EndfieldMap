import type { EntityData } from '@endfieldmap/map-core';
import { EndfieldSelect } from '@/components/common/endfield_components/form/select';
import { useDeltaRobot } from '@/hooks/use_delta_robot';
import { ZmdSquareButton } from '@/components/common/endfield_components/button/square_button';
import { cn } from '@/utils/style';
import { SubPopupTitle } from '@themes/endfield/ui/popup/right_content/title';

interface DeltaRobotProps {
  entity: EntityData;
}

export const DeltaRobot = ({ entity }: DeltaRobotProps) => {
  // const { t } = useTranslation(['popup', 'lang']);

  const {
    levelList,
    selectedLevel,
    setSelectedLevel,
    levelData,
    solutionGrid,
    solving,
    // statusMessage,
    handleSolve,
    getGroupColor,
    // getGroupName,
  } = useDeltaRobot({ levelLogicId: entity.levelLogicId });

  // 渲染求解网格
  const renderSolutionGrid = () => {
    if (!solutionGrid || !levelData) return null;

    const flatGrid = solutionGrid.flat();
    const { sizeX } = levelData;

    return (
      <div className="mb-6">
        <h3 className="text-sm font-semibold mb-2 text-gray-300">求解结果</h3>
        <div
          className="inline-grid gap-0.5 p-2 bg-[#1a1a1a] rounded"
          style={{
            gridTemplateColumns: `repeat(${sizeX}, minmax(0, 1fr))`,
          }}
        >
          {flatGrid.map((val, idx) => {
            const r = Math.floor(idx / sizeX);
            const c = idx % sizeX;

            let bgColor = '#2a2a2a';
            let content = '';

            if (val === -1) {
              // 非计数障碍
              bgColor = '#1a1a1a';
              content = '🚫';
            } else if (val >= 20000) {
              // 计数障碍
              const groupId = val - 20000;
              bgColor = getGroupColor(groupId);
              content = '🔒';
            } else if (val > 0) {
              // 拼图块
              const piece = levelData.pieces[val - 1];
              if (piece) {
                bgColor = getGroupColor(piece.groupId);
                content = String(val);
              }
            }

            return (
              <div
                key={`${r}-${c}`}
                className="w-8 h-8 flex items-center justify-center text-xs font-bold border border-gray-700"
                style={{ backgroundColor: bgColor }}
              >
                {content}
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <div>
      <SubPopupTitle>解决方案</SubPopupTitle>
      {/* 关卡选择 */}
      <div className="px-4 pt-4">
        <div className="mb-4">
          <label className="block text-sm font-semibold mb-2 text-gray-300">选择关卡（共 {levelList.length} 关）</label>
          <EndfieldSelect
            value={selectedLevel}
            options={levelList.map((id, index) => ({ value: id, label: `第 ${index + 1} 关` }))}
            onChange={(val) => setSelectedLevel(val)}
            className="w-full"
          />
        </div>
        {/* 库存列表 */}
        {levelData && (
          <div className="mb-6">
            <h3 className="text-sm font-semibold mb-2 text-gray-300">可用拼图 ({levelData.pieces.length} 个)</h3>
            <div
              className={cn(
                'max-h-40 overflow-y-auto grid gap-2 bg-[#1a1a1a] p-2 rounded',
                levelData.pieces.length < 4 ? 'grid-cols-3' : 'grid-cols-4'
              )}
            >
              {levelData.pieces.length === 0 ? (
                <div className="col-span-3 text-center text-gray-400 py-4">暂无拼图块</div>
              ) : (
                levelData.pieces.map((piece) => (
                  <div
                    key={piece.id}
                    className="flex items-center justify-center p-2 bg-[#2a2a2a] rounded hover:bg-[#333333] transition-colors"
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
          </div>
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
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-4 w-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            )
          }
        >
          {solving ? '求解中...' : '开始求解'}
        </ZmdSquareButton>

        {/* 状态信息 */}
        {/* {statusMessage && (
        <div
          className={`mb-4 p-2 rounded text-sm text-center ${
            statusMessage.includes('成功')
              ? 'bg-green-900/30 text-green-400'
              : statusMessage.includes('失败') || statusMessage.includes('出错')
                ? 'bg-red-900/30 text-red-400'
                : 'bg-blue-900/30 text-blue-400'
          }`}
        >
          {statusMessage}
        </div>
      )} */}

        {/* 求解结果网格 */}
        {renderSolutionGrid()}
      </div>
    </div>
  );
};
