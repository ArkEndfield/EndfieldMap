import { domEventListener } from '@endfieldmap/tools';
import { forwardRef, useCallback, useEffect, useRef, useState } from 'react';

import { MinusIcon, PlusIcon } from '@/components/common/icons';
import { cn } from '@/utils/style';

export interface RangeButtonProps {
  disabled?: boolean;
  onClick?: () => void;
  children?: React.ReactNode;
  className?: string;
}

export const RangeButton: React.FC<RangeButtonProps> = ({ disabled = false, onClick, children, className }) => (
  <button
    className={cn(
      'w-8 h-8 rounded-lg',
      'bg-white/10 hover:bg-white/20',
      'flex items-center justify-center',
      'text-white/70 hover:text-white',
      'transition-all duration-200',
      'active:scale-95',
      disabled && 'opacity-40 cursor-not-allowed',
      className
    )}
    onClick={onClick}
    disabled={disabled}
  >
    {children}
  </button>
);

export interface RangeBarProps {
  value?: number;
  onChange?: (value: number, isDragging?: boolean) => void;
  min?: number;
  max?: number;
  step?: number;
  disabled?: boolean;
  direction?: 'horizontal' | 'vertical';
  snapToStep?: boolean;
}

export const RangeBar: React.FC<RangeBarProps> = ({
  value: controlledValue,
  onChange,
  min = 0,
  max = 100,
  step = 1,
  disabled = false,
  direction = 'horizontal',
  snapToStep = false,
}) => {
  const [internalValue, setInternalValue] = useState(min);
  const [isDragging, setIsDragging] = useState(false);
  const trackRef = useRef<HTMLDivElement>(null);

  const isControlled = controlledValue !== undefined;
  const value = isControlled ? controlledValue : internalValue;

  const handleChange = useCallback(
    (newValue: number, isDragging?: boolean) => {
      if (!isControlled) {
        setInternalValue(newValue);
      }
      onChange?.(newValue, isDragging);
    },
    [isControlled, onChange]
  );

  // Calculate percentage
  const percentage = ((value - min) / (max - min)) * 100;

  // Set value based on click/drag position
  const setValue = useCallback(
    (clientX: number, clientY: number, isDragging: boolean) => {
      if (!trackRef.current || disabled) return;

      const rect = trackRef.current.getBoundingClientRect();
      let percentage: number;

      if (direction === 'horizontal') {
        percentage = (clientX - rect.left) / rect.width;
      } else {
        // Vertical direction, increase from bottom to top (inverted calculation)
        percentage = 1 - (clientY - rect.top) / rect.height;
      }

      percentage = Math.max(0, Math.min(1, percentage));

      // Calculate new value
      let newValue = min + percentage * (max - min);

      // Apply step only if snapToStep is enabled
      if (snapToStep) {
        newValue = Math.round(newValue / step) * step;
      }

      newValue = Math.max(min, Math.min(max, newValue));

      handleChange(newValue, isDragging);
    },
    [min, max, step, disabled, direction, snapToStep, handleChange]
  );

  // Handle track click
  const handleTrackClick = (event: React.MouseEvent) => {
    setValue(event.clientX, event.clientY, false);
  };

  // Start dragging
  const startDrag = (event: React.MouseEvent | React.TouchEvent) => {
    if (disabled) return;
    event.preventDefault();
    setIsDragging(true);
  };

  // Handle drag
  const onDrag = useCallback(
    (event: MouseEvent | TouchEvent) => {
      if (!isDragging) return;

      let clientX: number, clientY: number;
      if ('touches' in event) {
        clientX = event.touches[0].clientX;
        clientY = event.touches[0].clientY;
      } else {
        clientX = event.clientX;
        clientY = event.clientY;
      }

      setValue(clientX, clientY, true);
    },
    [isDragging, setValue]
  );

  // Stop dragging
  const stopDrag = useCallback(() => {
    setIsDragging(false);
  }, []);

  useEffect(() => {
    if (isDragging) {
      const d1 = domEventListener(window, 'mousemove', onDrag);
      const d2 = domEventListener(window, 'touchmove', onDrag);
      const d3 = domEventListener(window, 'mouseup', stopDrag);
      const d4 = domEventListener(window, 'touchend', stopDrag);

      return () => {
        d1();
        d2();
        d3();
        d4();
      };
    }
  }, [isDragging, onDrag, stopDrag]);

  const isVertical = direction === 'vertical';

  return (
    <div className={cn('relative flex items-center justify-center', isVertical ? 'h-full w-full' : 'w-full h-full')}>
      <div
        ref={trackRef}
        className={cn(
          'relative bg-white/10 rounded-lg cursor-pointer overflow-hidden',
          isVertical ? 'w-full h-full' : 'h-full w-full'
        )}
        onClick={handleTrackClick}
        onMouseDown={startDrag}
        onTouchStart={startDrag}
      >
        {/* Fill - iOS volume style */}
        <div
          className={cn('absolute bg-white transition-all', isDragging ? 'duration-0' : 'duration-200')}
          style={
            isVertical
              ? {
                  width: '100%',
                  height: `${percentage}%`,
                  bottom: 0,
                  borderRadius: '0 0 8px 8px',
                }
              : {
                  height: '100%',
                  width: `${percentage}%`,
                  left: 0,
                  borderRadius: '8px 0 0 8px',
                }
          }
        />
      </div>
    </div>
  );
};

export interface RangeInputProps {
  value?: number;
  onChange?: (value: number, isDragging?: boolean) => void;
  className?: string;
  min?: number;
  max?: number;
  step?: number;
  disabled?: boolean;
  direction?: 'horizontal' | 'vertical';
  snapToStep?: boolean;
  onIncrement?: () => void;
  onDecrement?: () => void;
  incrementIcon?: React.ReactNode;
  decrementIcon?: React.ReactNode;
  buttonClassName?: string;
}

export const RangeInput = forwardRef<HTMLDivElement, RangeInputProps>(
  (
    {
      value: controlledValue,
      onChange,
      className,
      min = 0,
      max = 100,
      step = 1,
      disabled = false,
      direction = 'vertical',
      snapToStep = false,
      onIncrement,
      onDecrement,
      incrementIcon,
      decrementIcon,
      buttonClassName,
    },
    ref
  ) => {
    // Internal state for uncontrolled mode
    const [internalValue, setInternalValue] = useState(min);

    // Determine if controlled or uncontrolled
    const isControlled = controlledValue !== undefined;
    const value = isControlled ? controlledValue : internalValue;

    const handleChange = (newValue: number, isDragging?: boolean) => {
      if (!isControlled) {
        setInternalValue(newValue);
      }
      onChange?.(newValue, isDragging);
    };

    const handleIncrement = () => {
      if (disabled) return;
      if (onIncrement) {
        // If custom increment handler is provided, use it
        onIncrement();
      } else {
        // Otherwise, handle internally with animation (isDragging = false)
        const newValue = Math.min(value + step, max);
        handleChange(newValue, false);
      }
    };

    const handleDecrement = () => {
      if (disabled) return;
      if (onDecrement) {
        // If custom decrement handler is provided, use it
        onDecrement();
      } else {
        // Otherwise, handle internally with animation (isDragging = false)
        const newValue = Math.max(value - step, min);
        handleChange(newValue, false);
      }
    };

    const isVertical = direction === 'vertical';

    return (
      <div
        ref={ref}
        className={cn(
          'flex justify-center items-center select-none',
          isVertical ? 'flex-col' : 'flex-row-reverse',
          className
        )}
      >
        {/* Increment button */}
        <RangeButton onClick={handleIncrement} disabled={disabled || value >= max} className={buttonClassName}>
          {incrementIcon || <PlusIcon className="w-4 h-4" />}
        </RangeButton>

        <div className={cn('flex items-center justify-center', isVertical ? 'flex-1 h-full w-8 py-1' : 'flex-1 w-full h-8 px-1')}>
          <RangeBar
            value={value}
            onChange={handleChange}
            min={min}
            max={max}
            step={step}
            disabled={disabled}
            direction={direction}
            snapToStep={snapToStep}
          />
        </div>

        {/* Decrement button */}
        <RangeButton onClick={handleDecrement} disabled={disabled || value <= min} className={buttonClassName}>
          {decrementIcon || <MinusIcon className="w-4 h-4" />}
        </RangeButton>
      </div>
    );
  }
);

RangeInput.displayName = 'RangeInput';
