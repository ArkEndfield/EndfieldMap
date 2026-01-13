export type Placement = 'top' | 'top-start' | 'top-end' | 'bottom' | 'bottom-start' | 'bottom-end' | 'left' | 'right';

export interface TooltipProps<T extends React.ElementType> {
  /** 是否禁用 toiltip */
  disabled?: boolean;
  /** tooltip 内容 */
  tooltip: React.ReactNode;
  /** 触发 tooltip 的组件 */
  children: React.ReactNode;
  /** tooltip 的位置 */
  placement?: Placement;
  /** tooltip 与触发元素的距离（像素） */
  offset?: number;
  /** 鼠标移到 tooltip 上时是否保持显示 */
  keepOnHover?: boolean;
  /** tooltip 的打开事件 */
  onOpen?: () => void;
  /** tooltip 的关闭事件 */
  onClose?: () => void;
  /** tooltip 的打开状态改变事件 */
  onOpenChange?: (open: boolean) => void;
  /** 自定义传入tooltip的一些类名 */
  classNames?: {
    /** tooltip 的外部容器 */
    toolTipContainer?: string;
    /** tooltip 的顶部边框 */
    topBorder?: string;
    /** tooltip 的内容容器 */
    content?: string;
  };
  /** 指定触发 tooltip 组件渲染的组件 */
  as?: T;
  /** 指定触发 tooltip 组件渲染的组件的 props */
  asProps?: React.ComponentProps<T>;
}

export interface Position {
  top: number;
  left: number;
}
