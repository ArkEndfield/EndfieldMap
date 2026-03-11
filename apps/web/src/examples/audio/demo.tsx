/**
 * 音效系统 - 完整演示页面
 * 整合所有音效示例的演示页面
 */

import { observer } from 'mobx-react-lite';
import { useState } from 'react';

import { AudioControlExamples } from './audio_controls';
import { BasicUsageExamples } from './basic_usage';
import { ButtonSoundExamples } from './button_sounds';
import { ModalSoundExamples } from './modal_sounds';

type TabType = 'basic' | 'buttons' | 'modals' | 'controls';

/**
 * 完整的音效系统演示页面
 */
export const AudioSystemDemo = observer(() => {
  const [activeTab, setActiveTab] = useState<TabType>('basic');

  const tabs = [
    { id: 'basic' as const, label: '基础使用', component: BasicUsageExamples },
    { id: 'buttons' as const, label: '按钮音效', component: ButtonSoundExamples },
    { id: 'modals' as const, label: '弹窗音效', component: ModalSoundExamples },
    { id: 'controls' as const, label: '控制面板', component: AudioControlExamples },
  ];

  const ActiveComponent = tabs.find((tab) => tab.id === activeTab)?.component || BasicUsageExamples;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 标题栏 */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-6xl mx-auto px-8 py-6">
          <h1 className="text-3xl font-bold text-gray-900">音效系统示例</h1>
          <p className="mt-2 text-gray-600">
            展示如何在 React 组件中使用音效系统，包括基础用法、按钮音效、弹窗音效和控制面板
          </p>
        </div>
      </div>

      {/* 标签页导航 */}
      <div className="bg-white border-b">
        <div className="max-w-6xl mx-auto px-8">
          <div className="flex space-x-8">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`py-4 px-2 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* 内容区域 */}
      <div className="max-w-6xl mx-auto px-8 py-8">
        <ActiveComponent />
      </div>

      {/* 页脚说明 */}
      <div className="bg-white border-t mt-12">
        <div className="max-w-6xl mx-auto px-8 py-6">
          <div className="text-sm text-gray-600">
            <p className="font-semibold mb-2">使用说明：</p>
            <ul className="list-disc list-inside space-y-1">
              <li>
                确保已将音效文件放置在 <code className="bg-gray-100 px-1 rounded">public/sounds/</code> 目录下
              </li>
              <li>
                在 <code className="bg-gray-100 px-1 rounded">src/const/audio_config.ts</code> 中配置音效类型和路径
              </li>
              <li>
                使用 <code className="bg-gray-100 px-1 rounded">useAudio()</code> hook 在组件中播放音效
              </li>
              <li>
                使用 <code className="bg-gray-100 px-1 rounded">observer()</code> 包装组件以响应 MobX 状态变化
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
});

export default AudioSystemDemo;
