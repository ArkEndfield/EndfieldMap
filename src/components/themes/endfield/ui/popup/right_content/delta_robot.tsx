/**
 * Delta Robot Puzzle Component
 * 数织拼图组件 - 仅展示库存列表和求解结果
 */

import type { EntityData } from '@endfieldmap/map-core';
import { useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';

import type { PieceUI, Group, Grid } from '@/data/delta_robot/types';
import { levelList } from '@/data/delta_robot/level_list';
import { parseLevelData } from '@/services/delta_robot/loader';
import { solvePuzzle } from '@/services/delta_robot/solver';

interface DeltaRobotProps {
  entity: EntityData;
}

export const DeltaRobot = ({ entity }: DeltaRobotProps) => {
  const { t } = useTranslation(['popup', 'lang']);

  // 状态管理
  const [selectedLevel, setSelectedLevel] = useState<string>(levelList[0] || '');
  const [pieces, setPieces] = useState<PieceUI[]>([]);
  const [groups, setGroups] = useState<Group[]>([]);
  const [sizeX, setSizeX] = useState<number>(4);
  const [sizeY, setSizeY] = useState<number>(4);
  const [rowConstraints, setRowConstraints] = useState<number[][]>([]);
  const [colConstraints, setColConstraints] = useState<number[][]>([]);
  const [obstaclesFlat, setObstaclesFlat] = useState<any[]>([]);
  const [solutionGrid, setSolutionGrid] = useState<Grid | null>(null);
  const [solving, setSolving] = useState<boolean>(false);
  const [statusMessage, setStatusMessage] = useState<string>('');

  // 加载关卡数据
  const loadLevel = useCallback(async (levelId: string) => {
    try {
      setStatusMessage('加载关卡数据中...');
      setSolutionGrid(null);

      // 加载关卡数据
      const levelRes = await fetch(`/gamedata/${levelId}.json`);
      if (!levelRes.ok) throw new Error('关卡数据加载失败');
      const levelData = await levelRes.json();

      // 拼图块加载器
      const pieceLoader = async (blockId: string) => {
        const res = await fetch(`/gamedata/${blockId}.json`);
        if (!res.ok) throw new Error(`拼图块 ${blockId} 加载失败`);
        return res.json();
      };

      // 解析关卡数据
      const parsed = await parseLevelData(levelData, pieceLoader);

      // 更新状态
      setSizeX(parsed.sizeX);
      setSizeY(parsed.sizeY);
      setGroups(parsed.groups);
      setPieces(parsed.pieces);
      setRowConstraints(parsed.rowConstraints);
      setColConstraints(parsed.colConstraints);
      setObstaclesFlat(parsed.obstaclesFlat);
      setStatusMessage('关卡加载成功！');
    } catch (error) {
      console.error('加载关卡失败:', error);
      setStatusMessage('关卡加载失败，请重试');
    }
  }, []);

  // 初始加载
  useEffect(() => {
    if (selectedLevel) {
      loadLevel(selectedLevel);
    }
  }, [selectedLevel, loadLevel]);

  // 求解拼图
  const handleSolve = useCallback(() => {
    if (pieces.length === 0) {
      setStatusMessage('没有可用的拼图块');
      return;
    }

    setSolving(true);
    setStatusMessage('正在求解...');

    // 使用 setTimeout 避免阻塞 UI
    setTimeout(() => {
      try {
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
  }, [pieces, sizeX, sizeY, rowConstraints, colConstraints, groups, obstaclesFlat]);

  // 获取分组颜色
  const getGroupColor = (groupId: number): string => {
    return groups[groupId]?.color || '#3CAAFF';
  };

  // 获取分组名称
  const getGroupName = (groupId: number): string => {
    return groups[groupId]?.name || 'Unknown';
  };

  // 渲染求解网格
  const renderSolutionGrid = () => {
    if (!solutionGrid) return null;

    const flatGrid = solutionGrid.flat();

    return (
      <div className="mb-6">
        <h3 className="text-sm font-semibold mb-2 text-gray-300">求解结果</h3>
        <div
          className="inline-grid gap-[2px] p-2 bg-[#1a1a1a] rounded"
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
              const piece = pieces[val - 1];
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
        <label className="block text-sm font-semibold mb-2 text-gray-300">
          选择关卡
        </label>
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
      <div className="mb-6">
        <h3 className="text-sm font-semibold mb-2 text-gray-300">
          拼图库存 ({pieces.length} 个)
        </h3>
        <div className="max-h-[300px] overflow-y-auto space-y-2 bg-[#1a1a1a] p-2 rounded">
          {pieces.length === 0 ? (
            <div className="text-center text-gray-400 py-4">暂无拼图块</div>
          ) : (
            pieces.map((piece, index) => (
              <div
                key={piece.id}
                className="flex items-center gap-2 p-2 bg-[#2a2a2a] rounded hover:bg-[#333333] transition-colors"
              >
                {/* 序号 */}
                <div className="text-[10px] text-gray-500 min-w-[24px]">
                  #{index + 1}
                </div>

                {/* 拼图缩略图 */}
                <div className="flex flex-col gap-[1px]">
                  {piece.shape.map((row, r) => (
                    <div key={r} className="flex gap-[1px]">
                      {row.map((val, c) => (
                        <div
                          key={c}
                          className="w-3 h-3"
                          style={{
                            backgroundColor:
                              val === 1 ? getGroupColor(piece.groupId) : 'transparent',
                          }}
                        />
                      ))}
                    </div>
                  ))}
                </div>

                {/* 分组名称 */}
                <span className="text-xs text-gray-400">
                  {getGroupName(piece.groupId)}
                </span>
              </div>
            ))
          )}
        </div>
      </div>

      {/* 求解按钮 */}
      <button
        onClick={handleSolve}
        disabled={solving || pieces.length === 0}
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
