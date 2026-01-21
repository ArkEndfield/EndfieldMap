import type { EntityData } from '@endfieldmap/map-core';
import { SubPopupTitle } from '@themes/endfield/ui/popup/right_content/title';

import { ZmdSquareButton } from '@/components/common/endfield_components/button/square_button';
import { EndfieldSelect } from '@/components/common/endfield_components/form/select';
import { useDeltaRobot } from '@/hooks/use_delta_robot';
import { cn } from '@/utils/style';

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

    // 获取单元格边框样式 - 只在格子边界处绘制边框
    const getCellBorderStyle = (val: number, row: number, col: number): {
      hasTop: boolean;
      hasRight: boolean;
      hasBottom: boolean;
      hasLeft: boolean;
    } => {
      if (val <= 0) {
        return { hasTop: false, hasRight: false, hasBottom: false, hasLeft: false };
      }

      // 获取四周相邻单元格的值
      const topVal = row > 0 ? flatGrid[(row - 1) * sizeX + col] : -1;
      const rightVal = col < sizeX - 1 ? flatGrid[row * sizeX + (col + 1)] : -1;
      const bottomVal = row < Math.ceil(flatGrid.length / sizeX) - 1 ? flatGrid[(row + 1) * sizeX + col] : -1;
      const leftVal = col > 0 ? flatGrid[row * sizeX + (col - 1)] : -1;

      // 判断相邻格子是否为同一拼图块（有效拼图块：>0 且 <20000）
      // 同一拼图块：值相等，且都不是障碍物
      const isSamePiece = (neighborVal: number) =>
        neighborVal > 0 && neighborVal < 20000 && neighborVal === val;

      // 只在边界处绘制边框：网格边界、与不同拼图块相邻、与障碍物相邻
      return {
        hasTop: row === 0 || !isSamePiece(topVal),
        hasRight: col === sizeX - 1 || !isSamePiece(rightVal),
        hasBottom: row === Math.ceil(flatGrid.length / sizeX) - 1 || !isSamePiece(bottomVal),
        hasLeft: col === 0 || !isSamePiece(leftVal),
      };
    };

    return (
      <div className="mb-6">
        <h3 className="text-sm font-semibold mb-2 text-gray-300">求解结果</h3>
        <div
          className="inline-grid gap-0 p-2 bg-[#1a1a1a] text-black rounded"
          style={{
            gridTemplateColumns: `repeat(${sizeX}, minmax(0, 1fr))`,
          }}
        >
          {flatGrid.map((val, idx) => {
            const r = Math.floor(idx / sizeX);
            const c = idx % sizeX;

            let bgColor = '#2a2a2a';
            let content = '';
            const borderColors = ['transparent', 'transparent', 'transparent', 'transparent'];
            const borderStyles = ['none', 'none', 'none', 'none'];

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

                // 获取边框信息
                const borderInfo = getCellBorderStyle(val, r, c);
                const borderColor = 'black';
                const borderStyle = 'solid';

                borderColors[0] = borderInfo.hasTop ? borderColor : 'transparent';
                borderColors[1] = borderInfo.hasRight ? borderColor : 'transparent';
                borderColors[2] = borderInfo.hasBottom ? borderColor : 'transparent';
                borderColors[3] = borderInfo.hasLeft ? borderColor : 'transparent';

                borderStyles[0] = borderInfo.hasTop ? borderStyle : 'none';
                borderStyles[1] = borderInfo.hasRight ? borderStyle : 'none';
                borderStyles[2] = borderInfo.hasBottom ? borderStyle : 'none';
                borderStyles[3] = borderInfo.hasLeft ? borderStyle : 'none';
              }
            }

            return (
              <div
                key={`${r}-${c}`}
                className="w-8 h-8 flex items-center justify-center text-xs font-bold transition-all duration-300"
                style={{
                  backgroundColor: bgColor,
                  borderTop: `${borderStyles[0]} 1px ${borderColors[0]}`,
                  borderRight: `${borderStyles[1]} 1px ${borderColors[1]}`,
                  borderBottom: `${borderStyles[2]} 1px ${borderColors[2]}`,
                  borderLeft: `${borderStyles[3]} 1px ${borderColors[3]}`,
                }}
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
