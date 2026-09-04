import './article.css';

import { cn } from '@endfieldmap/tools';
import { ButtonWithAudio } from '@endfieldmap/web-components/components/button_with_audio';
import type React from 'react';

export const DialogMetaRow: React.FC<{
  type?: string;
  date?: string;
  className?: string;
}> = ({ type, date, className }) => {
  if (!type && !date) return null;
  return (
    <div className={cn('relative mt-5 flex items-center', className)}>
      {type && (
        <span
          className={cn(
            'h-5 px-[1.35em] pt-[0.07em] box-border',
            'text-[15px] leading-5 font-medium',
            'bg-[#e6e6e6] text-[#808080]'
          )}
        >
          {type}
        </span>
      )}
      {date && <span className={cn('ml-5 text-[15px] leading-5 text-[#808080]')}>{date}</span>}
    </div>
  );
};

export const DialogContentTitle: React.FC<{ className?: string; children?: React.ReactNode }> = ({
  className,
  children,
}) => {
  return (
    <h2 className={cn('mt-2.5 text-[30px] leading-[1.45] font-medium text-[#191919] min-h-[2em]', className)}>
      {children}
    </h2>
  );
};

export const DialogContentDivider: React.FC<{ className?: string }> = ({ className }) => {
  return <div className={cn('mt-2.5 h-[3px] bg-[#d9d9d9]', className)} />;
};

export const DialogSectionLabel: React.FC<{ className?: string; children?: React.ReactNode }> = ({
  className,
  children,
}) => {
  return <div className={cn('mt-[1.875rem] text-[18.75px] text-[#888]', className)}>{children}</div>;
};

export const DialogNotice: React.FC<{ className?: string; children?: React.ReactNode }> = ({
  className,
  children,
}) => {
  return <div className={cn('mt-[1.125rem] text-[15px] leading-[1.5] text-[#808080]', className)}>{children}</div>;
};

export const DialogHatchedDivider: React.FC<{
  className?: string;
  icon?: React.ReactNode;
}> = ({ className, icon }) => {
  return (
    <div className={cn('relative mt-[2.625rem] w-[calc(100%-1.875rem)] h-5 border-b border-[#ccc] box-border', className)}>
      <div
        className={cn(
          'absolute inset-0 pointer-events-none',
          'bg-[linear-gradient(-45deg,transparent,transparent_18.3708%,#000_0,#000_31.6292%,transparent_0,transparent_68.3708%,#000_0,#000_81.6292%,transparent_0,transparent)]',
          'bg-size-[0.5rem_0.5rem] opacity-[0.08]'
        )}
      />
      <div className="absolute left-0 bottom-[-1px] w-[1.9375rem] h-[3.75px] bg-[#191919]" />
      {icon && <div className="absolute top-[1px] right-[-1.875rem] w-[1.125rem] text-[#b3b3b3]">{icon}</div>}
    </div>
  );
};

export const DialogArticle: React.FC<{ className?: string; children?: React.ReactNode }> = ({
  className,
  children,
}) => {
  return <div className={cn('ef-dialog-article', className)}>{children}</div>;
};

export const DialogActions: React.FC<{
  className?: string;
  children?: React.ReactNode;
}> = ({ className, children }) => {
  return <div className={cn('flex items-center justify-center gap-[1.5625rem]', className)}>{children}</div>;
};

export const DialogStatList: React.FC<{ className?: string; children?: React.ReactNode }> = ({
  className,
  children,
}) => {
  return <div className={cn('relative flex justify-between', className)}>{children}</div>;
};

export const DialogStatItem: React.FC<{
  label: React.ReactNode;
  icon?: React.ReactNode;
  className?: string;
  children?: React.ReactNode;
}> = ({ label, icon, className, children }) => {
  return (
    <div className={cn('relative flex-1 min-w-0', className)}>
      <div className="text-[18.75px] leading-none">{label}</div>
      <div className="relative mt-2.5 pl-[1.8375rem] text-[30px] font-bold leading-none">
        {icon && (
          <span className="absolute left-[-0.25rem] top-1/2 -translate-y-1/2 w-[1.9rem] flex justify-center text-[#191919]">
            {icon}
          </span>
        )}
        {children}
      </div>
    </div>
  );
};

export const DialogStatDivider: React.FC<{ className?: string }> = ({ className }) => {
  return <div className={cn('self-center w-px h-[3.25rem] bg-[#ccc] mx-[1.7rem]', className)} />;
};

export const DialogHeaderStrip: React.FC<{
  className?: string;
  children?: React.ReactNode;
}> = ({ className, children }) => {
  return (
    <div
      className={cn(
        'relative w-full h-[2.34rem] shrink-0',
        'bg-[linear-gradient(90deg,#fff_0,#fff_7.8125rem,#f0f0f0_7.8125rem,#f0f0f0)]',
        'flex items-center justify-end pr-[2.7rem] box-border',
        className
      )}
    >
      {children}
    </div>
  );
};

export const DialogRadioOption: React.FC<{
  checked?: boolean;
  disabled?: boolean;
  className?: string;
  children?: React.ReactNode;
  onClick?: () => void;
}> = ({ checked, disabled, className, children, onClick }) => {
  return (
    <ButtonWithAudio
      className={cn('relative min-w-[7.8rem] flex-1 text-left cursor-pointer', disabled && 'cursor-not-allowed', className)}
      disabled={disabled}
      onClick={onClick}
    >
      <span
        className={cn(
          'relative block w-[2rem] h-[2rem] rounded-full border-[2.5px] border-white',
          'shadow-[0_0_0.3rem_rgba(38,38,38,0.5)] transition-colors duration-200',
          checked ? 'bg-[#767676]' : disabled ? 'bg-[#b3b3b3]' : 'bg-[#e6e6e6] hover:bg-[#d9d9d9]'
        )}
      >
        <span
          className={cn(
            'absolute top-1/2 left-1/2 -translate-1/2 rounded-full transition-all duration-200',
            'w-[1.4rem] h-[1.4rem]',
            checked ? 'bg-[#fffa00] scale-[0.66]' : 'bg-white'
          )}
        />
      </span>
      <span className="absolute top-[0.55rem] left-[2.8rem] text-[15px] leading-tight text-[#191919] whitespace-nowrap">
        {children}
      </span>
    </ButtonWithAudio>
  );
};

export const DialogSuccessBox: React.FC<{
  className?: string;
  children?: React.ReactNode;
}> = ({ className, children }) => {
  return (
    <div
      className={cn(
        'w-[min(37.5rem,100%)] box-border px-6 py-5',
        'bg-[#e5e5e5] text-[#191919]',
        'flex flex-col items-center text-center',
        'text-[1.875rem] leading-[1.25]',
        className
      )}
    >
      {children}
    </div>
  );
};

export const DialogTabs = <T extends string | number>({
  tabs,
  active,
  onChange,
  className,
}: {
  tabs: readonly { key: T; label: React.ReactNode }[];
  active?: T;
  onChange?: (key: T) => void;
  className?: string;
}) => {
  return (
    <div className={cn('flex shrink-0 bg-[#f0f0f0]', className)}>
      {tabs.map((tab) => {
        const isActive = tab.key === active;
        return (
          <ButtonWithAudio
            key={String(tab.key)}
            className={cn(
              'relative flex-1 py-[0.55rem] px-4 text-[15px] leading-none transition-colors cursor-pointer',
              isActive ? 'bg-[#363636] text-white font-medium' : 'text-[#808080] hover:text-[#191919] hover:bg-[#e6e6e6]'
            )}
            onClick={() => onChange?.(tab.key)}
          >
            {isActive && <div className="absolute top-0 left-0 right-0 h-[3px] bg-[#fffa00]" />}
            {tab.label}
          </ButtonWithAudio>
        );
      })}
    </div>
  );
};
