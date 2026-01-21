import { AnimatePresence, motion } from 'motion/react';
import { createPortal } from 'react-dom';

import { ZmdRoundIconButton } from '@/components/common/endfield_components/button/round_icon_button';
import { ChevronUpTriangle } from '@/components/common/icons';
import { cn } from '@/utils/style';

/**
 * BottomSheet 各元素的自定义样式类名
 * 可以是字符串或接收 open 状态的函数
 */
export interface BottomSheetClassNames {
  /** 背景遮罩层 */
  backdrop?: string | ((open: boolean) => string);
  /** 外层容器（控制定位） */
  container?: string | ((open: boolean) => string);
  /** 内容包裹器 */
  content?: string | ((open: boolean) => string);
}

export interface BottomSheetProps {
  /** 面板标题 */
  title?: string;
  /** 底部弹出层是否可见（控制进入/退出动画） */
  open: boolean;
  /** 内容是否折叠（控制内容高度动画） */
  collapsed: boolean;
  /** 弹出层内的内容 */
  children: React.ReactNode;
  /** 点击背景/白条是否可以切换折叠状态 */
  dismissible?: boolean;
  /** 各元素的自定义样式类名 */
  classNames?: BottomSheetClassNames;
  /** 切换折叠状态时调用（点击背景或白条触发） */
  onToggleCollapse?: () => void;
  /** 退出动画完成时调用 */
  onExited?: () => void;
  /** 进入动画完成时调用 */
  onEntered?: () => void;
}

const getClassName = (
  className: string | ((open: boolean) => string) | undefined,
  open: boolean
): string | undefined => {
  if (typeof className === 'function') {
    return className(open);
  }
  return className;
};

export const BottomSheet = ({
  title,
  open,
  collapsed,
  children,
  dismissible = true,
  classNames,
  onToggleCollapse,
  onExited,
  onEntered,
}: BottomSheetProps) => {
  const handleToggle = () => {
    if (!dismissible) return;
    onToggleCollapse?.();
  };

  return createPortal(
    <AnimatePresence onExitComplete={onExited}>
      {open && (
        <>
          {/* 背景遮罩 - 仅在展开时显示 */}
          <AnimatePresence>
            {!collapsed && (
              <motion.div
                className={cn('fixed inset-0 z-10 bg-black/40 text-white', getClassName(classNames?.backdrop, open))}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2, ease: 'easeInOut' }}
                onClick={handleToggle}
              />
            )}
          </AnimatePresence>
          {/* 弹出层容器 - 使用 translateY 实现进入/退出动画 */}
          <motion.div
            className={cn(
              'fixed bottom-0 left-0 right-0 z-10 flex flex-col bg-[#272727] text-white',
              'pb-8 pt-4',
              getClassName(classNames?.container, open)
            )}
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'tween', duration: 0.25, ease: 'easeOut' }}
            onAnimationComplete={(definition) => {
              if (definition === 'animate' && onEntered) {
                onEntered();
              }
            }}
          >
            {/* 标题按钮区域 */}
            <div className="absolute z-2 -top-2 left-5 w-fit max-w-full bg-[#434343] flex rounded-full text-xs h-4.5 items-center">
              <ZmdRoundIconButton className="z-1 h-5.5 w-18" onClick={handleToggle}>
                <ChevronUpTriangle
                  className={cn('transition-transform text-sm', collapsed ? 'rotate-0' : 'rotate-180')}
                />
              </ZmdRoundIconButton>
              <button className={cn('flex-1 truncate', title && 'pl-1 pr-4')} onClick={handleToggle}>
                {title}
              </button>
            </div>

            {/* 内容区域 - 使用 height 动画实现折叠/展开 */}
            <motion.div
              className={cn('overflow-hidden', getClassName(classNames?.content, open))}
              initial={false}
              animate={{
                height: collapsed ? 0 : '60vh',
              }}
              transition={{ type: 'tween', duration: 0.2, ease: 'easeInOut' }}
            >
              <div className="h-full">{children}</div>
            </motion.div>

            {/* 底部 Logo */}
            {/* <div className="flex justify-center items-center py-3 bg-[#272727]">
              <Logo height="2rem" />
            </div> */}
          </motion.div>
        </>
      )}
    </AnimatePresence>,
    document.body
  );
};
