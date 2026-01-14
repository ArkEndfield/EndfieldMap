import { cn } from '@/utils/style';
import type React from 'react';
import Tooltip from '@themes/endfield/components/tooltip';

export interface OperationConfig {
  key?: React.Key;
  label?: string;
  icon: React.ReactNode;
  onClick?: () => void;
  active?: boolean;
}

export interface OperationItemProps {
  children?: React.ReactNode;
  rightBorder?: boolean;
  actions: OperationConfig[];
  className?: string;
  classNames?: {
    container?: string;
    content?: string;
    actions?: string;
  };
}

export const OperationItem = ({ children, rightBorder, actions, className, classNames }: OperationItemProps) => {
  return (
    <div
      className={cn(
        'flex items-center gap-2 p-2 pb-1.5 relative',
        rightBorder &&
          'after:absolute after:right-0 after:top-1/2 after:-translate-y-1/2 after:w-px after:h-4 after:bg-[#A3A3A3]',
        className,
        classNames?.container
      )}
    >
      {children && <div className={classNames?.content}>{children}</div>}
      <div className={cn('text-2xl flex items-center justify-center', classNames?.actions)}>
        {actions.map((action) => {
          return (
            <Tooltip
              as="button"
              key={action.key}
              tooltip={action.label}
              placement="bottom"
              asProps={{
                onClick: action.onClick,
                className: cn(
                  'text-[#A3A3A3] w-8 h-8 hover:text-[#dad695]',
                  action.active && 'text-[#FCF250] hover:text-[#FCF250]'
                ),
              }}
            >
              {action.icon}
            </Tooltip>
          );
        })}
      </div>
    </div>
  );
};

export const OperationItemTitle = ({ title, subTitle }: { title: string; subTitle?: string }) => {
  return (
    <div>
      <div className="text-[#eeeeee] text-xs">{title}</div>
      {subTitle && <div className="text-[#bfbfbf] font-[Outfit] text-xs">{subTitle}</div>}
    </div>
  );
};
