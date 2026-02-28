/**
 * 音效系统 - 弹窗/对话框音效示例
 * 展示如何为弹窗、对话框等UI元素添加打开/关闭音效
 */

import { SoundType } from '@endfieldmap/map-web-theme-types/audio';
import { useAudio } from '@endfieldmap/web-components';
import { observer } from 'mobx-react-lite';
import { useEffect, useState } from 'react';

/**
 * 示例 1: 简单的弹窗音效
 */
export const SimpleModalExample = observer(() => {
  const { play } = useAudio();
  const [isOpen, setIsOpen] = useState(false);

  const openModal = () => {
    setIsOpen(true);
    play(SoundType.PRIZE_CONFIRM);
  };

  const closeModal = () => {
    setIsOpen(false);
    play(SoundType.CLAIM);
  };

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">示例 1: 简单弹窗</h3>
      <button onClick={openModal} className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600">
        打开弹窗
      </button>

      {isOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-xl font-bold mb-4">弹窗标题</h3>
            <p className="mb-6">这是一个带音效的弹窗示例</p>
            <button onClick={closeModal} className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600">
              关闭
            </button>
          </div>
        </div>
      )}
    </div>
  );
});

/**
 * 示例 2: 使用 useEffect 自动播放打开音效
 */
export const AutoSoundModalExample = observer(() => {
  const { play } = useAudio();
  const [isOpen, setIsOpen] = useState(false);

  // 当弹窗打开时自动播放音效
  useEffect(() => {
    if (isOpen) {
      play(SoundType.PRIZE_CONFIRM);
    }
  }, [isOpen, play]);

  const closeModal = () => {
    play(SoundType.CLAIM);
    setIsOpen(false);
  };

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">示例 2: 自动播放音效（useEffect）</h3>
      <button onClick={() => setIsOpen(true)} className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600">
        打开弹窗
      </button>

      {isOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-xl font-bold mb-4">自动音效弹窗</h3>
            <p className="mb-6">打开时自动播放音效</p>
            <button onClick={closeModal} className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600">
              关闭
            </button>
          </div>
        </div>
      )}
    </div>
  );
});

/**
 * 示例 3: 可重用的音效弹窗组件
 */
interface SoundModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}

const SoundModal = observer(({ isOpen, onClose, title, children }: SoundModalProps) => {
  const { play } = useAudio();

  useEffect(() => {
    if (isOpen) {
      play(SoundType.PRIZE_CONFIRM);
    }
  }, [isOpen, play]);

  const handleClose = () => {
    play(SoundType.CLAIM);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4 shadow-xl">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-xl font-bold">{title}</h3>
          <button onClick={handleClose} className="text-gray-500 hover:text-gray-700 text-2xl leading-none">
            ×
          </button>
        </div>
        <div className="mb-6">{children}</div>
        <div className="flex justify-end gap-2">
          <button onClick={handleClose} className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600">
            关闭
          </button>
        </div>
      </div>
    </div>
  );
});

export const ReusableModalExample = observer(() => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">示例 3: 可重用的音效弹窗组件</h3>
      <button
        onClick={() => setIsOpen(true)}
        className="px-4 py-2 bg-purple-500 text-white rounded hover:bg-purple-600"
      >
        打开可重用弹窗
      </button>

      <SoundModal isOpen={isOpen} onClose={() => setIsOpen(false)} title="可重用弹窗">
        <p>这是一个可重用的带音效的弹窗组件</p>
        <p className="mt-2 text-sm text-gray-600">你可以在整个应用中重复使用这个组件</p>
      </SoundModal>
    </div>
  );
});

/**
 * 示例 4: 确认对话框
 */
export const ConfirmDialogExample = observer(() => {
  const { play } = useAudio();
  const [isOpen, setIsOpen] = useState(false);

  const openDialog = () => {
    setIsOpen(true);
    play(SoundType.PRIZE_CONFIRM);
  };

  const handleConfirm = () => {
    play(SoundType.TICK);
    setIsOpen(false);
    alert('已确认！');
  };

  const handleCancel = () => {
    play(SoundType.CLAIM);
    setIsOpen(false);
  };

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">示例 4: 确认对话框</h3>
      <button onClick={openDialog} className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600">
        删除项目
      </button>

      {isOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-xl font-bold mb-4">确认删除</h3>
            <p className="mb-6">您确定要删除这个项目吗？此操作无法撤销。</p>
            <div className="flex justify-end gap-2">
              <button onClick={handleCancel} className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600">
                取消
              </button>
              <button onClick={handleConfirm} className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600">
                确认删除
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
});

/**
 * 示例 5: 多个弹窗
 */
export const MultipleModalsExample = observer(() => {
  const { play } = useAudio();
  const [modal1Open, setModal1Open] = useState(false);
  const [modal2Open, setModal2Open] = useState(false);

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">示例 5: 多个弹窗</h3>
      <div className="flex gap-4">
        <button
          onClick={() => {
            setModal1Open(true);
            play(SoundType.PRIZE_CONFIRM);
          }}
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
        >
          打开弹窗 1
        </button>
        <button
          onClick={() => {
            setModal2Open(true);
            play(SoundType.CLAIM);
          }}
          className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
        >
          打开弹窗 2
        </button>
      </div>

      <SoundModal isOpen={modal1Open} onClose={() => setModal1Open(false)} title="弹窗 1">
        <p>这是第一个弹窗</p>
      </SoundModal>

      <SoundModal isOpen={modal2Open} onClose={() => setModal2Open(false)} title="弹窗 2">
        <p>这是第二个弹窗</p>
      </SoundModal>
    </div>
  );
});

/**
 * 组合所有弹窗音效示例
 */
export const ModalSoundExamples = observer(() => {
  return (
    <div className="max-w-4xl mx-auto p-8 space-y-8">
      <h2 className="text-2xl font-bold mb-6">音效系统 - 弹窗音效示例</h2>

      <SimpleModalExample />
      <hr className="border-gray-300" />

      <AutoSoundModalExample />
      <hr className="border-gray-300" />

      <ReusableModalExample />
      <hr className="border-gray-300" />

      <ConfirmDialogExample />
      <hr className="border-gray-300" />

      <MultipleModalsExample />
    </div>
  );
});
