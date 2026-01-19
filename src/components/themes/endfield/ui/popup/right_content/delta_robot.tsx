/**
 * Delta Robot Puzzle Component
 * 数织拼图组件 - 仅展示库存列表和求解结果
 */

import type { EntityData } from '@endfieldmap/map-core';

// import { useTranslation } from 'react-i18next';
import { useDeltaRobot } from '@/hooks/use_delta_robot';

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
    statusMessage,
    handleSolve,
    getGroupColor,
    getGroupName,
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
    <div className="p-4">
      {/* 关卡选择 */}
      <div className="mb-4">
        <label className="block text-sm font-semibold mb-2 text-gray-300">选择关卡</label>
        <select
          value={selectedLevel}
          onChange={(e) => setSelectedLevel(e.target.value)}
          className="w-full px-3 py-2 bg-[#2a2a2a] border border-gray-700 rounded text-sm text-gray-300"
        >
          {levelList.map((id) => (
            <option key={id} value={id}>
              {id}
            </option>
          ))}
        </select>
      </div>

      {/* 库存列表 */}
      {levelData && (
        <div className="mb-6">
          <h3 className="text-sm font-semibold mb-2 text-gray-300">拼图库存 ({levelData.pieces.length} 个)</h3>
          <div className="max-h-[300px] overflow-y-auto space-y-2 bg-[#1a1a1a] p-2 rounded">
            {levelData.pieces.length === 0 ? (
              <div className="text-center text-gray-400 py-4">暂无拼图块</div>
            ) : (
              levelData.pieces.map((piece, index) => (
                <div
                  key={piece.id}
                  className="flex items-center gap-2 p-2 bg-[#2a2a2a] rounded hover:bg-[#333333] transition-colors"
                >
                  {/* 序号 */}
                  <div className="text-[10px] text-gray-500 min-w-6">#{index + 1}</div>

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

                  {/* 分组名称 */}
                  <span className="text-xs text-gray-400">{getGroupName(piece.groupId)}</span>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* 求解按钮 */}
      <button
        onClick={handleSolve}
        disabled={solving || !levelData || levelData.pieces.length === 0}
        className="w-full py-2 mb-4 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white font-semibold rounded transition-colors"
      >
        {solving ? '求解中...' : '开始求解'}
      </button>

      {/* 状态信息 */}
      {statusMessage && (
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
      )}

      {/* 求解结果网格 */}
      {renderSolutionGrid()}
    </div>
  );
};
