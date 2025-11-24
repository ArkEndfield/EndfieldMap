import { useRef, useState } from 'react';
import { observer } from 'mobx-react-lite';

import type { ControlPanelProps } from '@/components/themes/types/control_panel';
import { dataService } from '@/services/data';

/**
 * 电线杆预设管理面板（Endfield 主题）
 * - 展示当前电线杆预设完整列表
 * - 支持创建新预设（从当前地图数据）
 * - 支持切换预设（点击列表项）
 * - 支持多选导出预设为 JSON
 * - 支持对每个预设单独重命名 / 删除
 *
 * 依赖 MobX 响应式的 electricPoleDataService，列表勾选状态为本地 UI 状态。
 */
const ElectricPolePresetPanel: React.FC<ControlPanelProps> = observer(({ adapter }) => {
  if (!adapter) return null;

  const service = dataService.electricPoleDataService;
  const currentPresetId = service.currentPresetId ?? '';
  const presets = service.presetList;

  // 选中用于导出的预设 ID 列表
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const handleCreatePreset = async () => {
    const name = window.prompt('请输入新电线杆预设名称：', '新预设');
    if (!name) return;

    await service.createPreset(name);
    // 不需要手动 setState，由 MobX 驱动组件重渲染
  };

  const handleSwitchPreset = async (id: string) => {
    if (!id) return;
    await service.switchPreset(id);
  };

  const handleToggleSelect = (id: string, checked: boolean) => {
    setSelectedIds((prev) => {
      if (checked) {
        if (prev.includes(id)) return prev;
        return [...prev, id];
      }
      return prev.filter((x) => x !== id);
    });
  };

  const handleExportSelected = () => {
    if (!selectedIds.length) return;
    try {
      service.exportPresets(selectedIds);
    } catch (error) {
      console.error('Failed to export electric pole preset bundle:', error);
    }
  };

  const handleDeleteSelected = async () => {
    if (!selectedIds.length) return;
    const confirmed = window.confirm(`确定要删除选中的 ${selectedIds.length} 个电线杆预设吗？此操作不可恢复。`);
    if (!confirmed) return;

    for (const id of selectedIds) {
      try {
        await service.deletePreset(id);
      } catch (error) {
        console.error('Failed to delete electric pole preset:', id, error);
      }
    }

    setSelectedIds([]);
  };

  const handleDeletePreset = async (id: string) => {
    const preset = presets.find((p) => p.id === id);
    const name = preset?.name ?? '';
    const confirmed = window.confirm(`确定要删除预设「${name || id}」吗？此操作不可恢复。`);
    if (!confirmed) return;
    await service.deletePreset(id);
    // 同步更新勾选状态
    setSelectedIds((prev) => prev.filter((x) => x !== id));
  };

  const handleRenamePreset = async (id: string) => {
    const preset = presets.find((p) => p.id === id);
    const currentName = preset?.name ?? '';
    const name = window.prompt('请输入新的电线杆预设名称：', currentName || '新预设名称');
    if (!name) return;
    await service.renamePreset(id, name);
  };

  const isSelectedAll = presets.length > 0 && selectedIds.length === presets.length;
  const isIndeterminate = selectedIds.length > 0 && selectedIds.length < presets.length;

  const handleToggleSelectAll = () => {
    if (isSelectedAll) {
      setSelectedIds([]);
    } else {
      setSelectedIds(presets.map((p) => p.id));
    }
  };

  const handleClickImport = () => {
    fileInputRef.current?.click();
  };

  const handleImportFileChange: React.ChangeEventHandler<HTMLInputElement> = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      const text = await file.text();
      const parsed = JSON.parse(text);

      // 仅支持新的 bundle 结构
      if (parsed && parsed.type === 'electric_pole_preset_bundle' && Array.isArray(parsed.presets)) {
        await service.importPresetBundle(parsed);
        window.alert('电线杆预设导入成功。');
      } else {
        throw new Error('Invalid electric pole preset bundle format');
      }
    } catch (error) {
      console.error('Failed to import electric pole presets:', error);
      window.alert('电线杆预设导入失败：文件格式不合法或解析错误。');
    } finally {
      // 允许重复选择同一个文件
      event.target.value = '';
    }
  };

  return (
    <div className="p-3 space-y-2">
      <div className="flex items-center justify-between">
        <div className="text-sm font-semibold text-gray-800">电线杆预设管理</div>
        <button
          onClick={handleCreatePreset}
          className="bg-gray-100 hover:bg-gray-200 text-gray-800 text-xs py-1 px-2 rounded transition-colors"
        >
          新建预设
        </button>
      </div>

      <div className="flex items-center justify-between text-xs">
        <div className="flex items-center gap-1">
          <input
            type="checkbox"
            checked={isSelectedAll}
            ref={(el) => {
              if (el) {
                el.indeterminate = isIndeterminate;
              }
            }}
            onChange={handleToggleSelectAll}
          />
          <span>全选</span>
        </div>
        <span className="text-[11px] text-gray-400">
          共 {presets.length} 个预设，已选 {selectedIds.length} 个
        </span>
      </div>

      <div className="border border-gray-200 rounded-md max-h-64 overflow-y-auto bg-white/80">
        {presets.length === 0 ? (
          <div className="py-6 text-center text-xs text-gray-400">暂无预设，请先创建。</div>
        ) : (
          <ul className="divide-y divide-gray-100">
            {presets.map((preset) => {
              const isCurrent = preset.id === currentPresetId;
              const isChecked = selectedIds.includes(preset.id);
              return (
                <li
                  key={preset.id}
                  className={`flex items-center gap-2 px-2 py-1.5 text-xs cursor-pointer ${
                    isCurrent ? 'bg-emerald-50 border-l-2 border-emerald-400' : 'hover:bg-gray-50'
                  }`}
                  onClick={() => handleSwitchPreset(preset.id)}
                >
                  <input
                    type="checkbox"
                    className="shrink-0"
                    checked={isChecked}
                    onClick={(e) => e.stopPropagation()}
                    onChange={(e) => {
                      e.stopPropagation();
                      handleToggleSelect(preset.id, e.target.checked);
                    }}
                  />
                  <div className="flex-1 min-w-0">
                    <div className={`truncate ${isCurrent ? 'font-semibold text-emerald-700' : 'text-gray-800'}`}>
                      {preset.name || '(未命名预设)'}
                    </div>
                    {isCurrent && <div className="text-[10px] text-emerald-600 mt-0.5">当前预设</div>}
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      className="px-1.5 py-0.5 rounded text-[11px] bg-blue-50 text-blue-600 hover:bg-blue-100"
                      onClick={(e) => {
                        e.stopPropagation();
                        void handleRenamePreset(preset.id);
                      }}
                    >
                      重命名
                    </button>
                    <button
                      className="px-1.5 py-0.5 rounded text-[11px] bg-red-50 text-red-600 hover:bg-red-100"
                      onClick={(e) => {
                        e.stopPropagation();
                        void handleDeletePreset(preset.id);
                      }}
                    >
                      删除
                    </button>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>

      <div className="flex items-center justify-between gap-2 pt-1">
        <button
          onClick={handleExportSelected}
          className="flex-1 bg-emerald-500 hover:bg-emerald-600 text-white text-xs py-1 px-2 rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          disabled={!selectedIds.length}
        >
          导出所选预设
        </button>
        <button
          onClick={handleDeleteSelected}
          className="bg-red-500 hover:bg-red-600 text-white text-xs py-1 px-2 rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          disabled={!selectedIds.length}
        >
          批量删除
        </button>
        <button
          onClick={handleClickImport}
          className="bg-sky-500 hover:bg-sky-600 text-white text-xs py-1 px-2 rounded transition-colors"
        >
          导入预设
        </button>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="application/json"
        className="hidden"
        onChange={handleImportFileChange}
      />
    </div>
  );
});

export default ElectricPolePresetPanel;
