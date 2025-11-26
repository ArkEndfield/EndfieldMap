import { cn } from '@/utils/style';
import { AnimatePresence, motion } from 'motion/react';
import { useEffect, useRef, useState, forwardRef } from 'react';
import { ScrollArea } from '../../scroll_area';

export interface EndfieldSelectItem<T extends string> {
  label: React.ReactNode;
  value: T;
  left?: React.ReactNode | ((active: boolean) => React.ReactNode);
  right?: React.ReactNode | ((active: boolean) => React.ReactNode);
  disabled?: boolean;
  hidden?: boolean;
  description?: React.ReactNode;
}

export interface EndfieldSelectProps<T extends string> {
  options: readonly EndfieldSelectItem<T>[];
  value: T;
  disabled?: boolean;
  className?: string;
  onChange: (value: T) => void;
}

export interface TriggerProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  expand?: boolean;
}

export interface OptionProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  left?: React.ReactNode | ((active: boolean) => React.ReactNode);
  right?: React.ReactNode | ((active: boolean) => React.ReactNode);
  select?: boolean;
}

const Trigger = forwardRef<HTMLButtonElement, TriggerProps>((props, ref) => {
  const { children, className, disabled, expand, ...rest } = props;

  return (
    <button
      {...rest}
      ref={ref}
      disabled={disabled}
      className={cn(
        'relative flex w-full z-1 text-left items-center',
        'py-1 pl-3.5 pr-2.5 rounded-full',
        disabled ? 'bg-[#EDEBEC]/40 text-[#6e6d6e]' : 'bg-[#EDEBEC] shadow-md hover:bg-[#e0e0e0] active:bg-[#EDEBEC]',
        className
      )}
    >
      <span className="flex-1">{children}</span>
      <div className="shrink-0 grow-0">
        <svg
          viewBox="0 0 1024 1024"
          version="1.1"
          xmlns="http://www.w3.org/2000/svg"
          width="0.6em"
          height="0.6em"
          className={cn('transition-transform duration-300', expand ? 'rotate-180' : '')}
        >
          <path
            d="M957.056 338.624C951.84 327.296 940.512 320 928 320L96 320c-12.512 0-23.84 7.296-29.088 18.624-5.216 11.36-3.328 24.704 4.768 34.208l416 485.344c6.08 7.104 14.944 11.2 24.288 11.2s18.208-4.096 24.288-11.2l416-485.344C960.448 363.328 962.272 349.984 957.056 338.624z"
            fill="currentColor"
          ></path>
        </svg>
      </div>
    </button>
  );
});

const Option = forwardRef<HTMLButtonElement, OptionProps>((props, ref) => {
  const { children, className, left, right, select, disabled, ...rest } = props;
  const leftContent = typeof left === 'function' ? left(!!select) : left;
  const rightContent = typeof right === 'function' ? right(!!select) : right;
  return (
    <button
      {...rest}
      ref={ref}
      className={cn(
        'relative flex w-full z-1 text-left items-center',
        'py-1.5 px-1',
        disabled ? 'text-[#6e6d6e]' : select ? 'bg-[#5F5F5F] text-white' : 'hover:bg-[#e0e0e0]',
        className
      )}
    >
      {select && <div className='absolute left-[1.5px] w-[2.5px] rounded-full h-4.5 bg-white top-1/2 -translate-y-1/2'></div>}
      {leftContent && <div className="shrink-0 grow-0 ml-1">{leftContent}</div>}
      <span className="flex-1 mx-2">{children}</span>
      {rightContent && <div className="shrink-0 grow-0 mr-1">{rightContent}</div>}
      <div className="w-4 flex items-center justify-center">
        {select && (
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="0.85em"
            height="0.85em"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="3"
          >
            <polyline points="20 6 9 17 4 12"></polyline>
          </svg>
        )}
      </div>
    </button>
  );
});

export const EndfieldSelect = <T extends string>({
  options,
  value,
  onChange,
  disabled,
  className,
}: EndfieldSelectProps<T>) => {
  const [open, setOpen] = useState(false);
  const selectContainerRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const currentValueLabel = options.find((item) => item.value === value)?.label;
  const handleClickOutside = (event: MouseEvent) => {
    if (
      selectContainerRef.current &&
      triggerRef.current &&
      !selectContainerRef.current.contains(event.target as Node) &&
      !triggerRef.current.contains(event.target as Node)
    ) {
      setOpen(false);
    }
  };
  const selectValue = (newValueItem: EndfieldSelectItem<T>) => {
    if (newValueItem.disabled || newValueItem.hidden) {
      return;
    }
    if (newValueItem.value !== value) {
      onChange(newValueItem.value);
      setOpen(false);
    }
  };
  const toggleSelect = () => {
    if (!disabled) {
      setOpen(!open);
    }
  };
  useEffect(() => {
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);
  return (
    <div className={cn('relative w-full text-[#373537]', className)}>
      <Trigger expand={open} ref={triggerRef} onClick={toggleSelect} disabled={disabled}>
        {currentValueLabel}
      </Trigger>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{
              scaleY: 0,
              opacity: 0,
            }}
            animate={{
              scaleY: 1,
              opacity: 1,
            }}
            exit={{
              scaleY: 0,
              opacity: 0,
            }}
            transition={{
              duration: 0.15,
              ease: 'easeOut',
            }}
            style={{
              originY: 0,
            }}
            ref={selectContainerRef}
            className="absolute top-1/2 left-0 min-w-full flex flex-col w-max z-0 bg-[#D4D2D3] rounded-b-md shadow-md overflow-hidden max-h-64"
          >
            <div className="h-5.5 shrink-0 grow-0"></div>
            <ScrollArea className="flex-1 w-full h-full overflow-hidden">
              {options.map((item) => (
                <Option
                  key={item.value}
                  onClick={() => selectValue(item)}
                  disabled={disabled || item.disabled}
                  select={value === item.value}
                  left={item.left}
                  right={item.right}
                >
                  {item.label}
                </Option>
              ))}
            </ScrollArea>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
