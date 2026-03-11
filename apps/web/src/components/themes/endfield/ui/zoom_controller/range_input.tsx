import { domEventListener } from '@endfieldmap/tools';
import { cn } from '@endfieldmap/tools';
import { ZmdRoundIconButton } from '@endfieldmap/web-components';
import { forwardRef, useCallback, useEffect, useRef, useState } from 'react';

import { MinusIcon, PlusIcon } from '@endfieldmap/web-components';

export interface RangeBarProps {
  value?: number;
  onChange?: (value: number, isDragging?: boolean) => void;
  min?: number;
  max?: number;
  step?: number;
  disabled?: boolean;
  format?: (value: number) => string;
  snapToStep?: boolean;
}

export const RangeBar: React.FC<RangeBarProps> = ({
  value: controlledValue,
  onChange,
  min = 0,
  max = 100,
  step = 1,
  disabled = false,
  snapToStep = false,
}) => {
  const [internalValue, setInternalValue] = useState(min);
  const [isDragging, setIsDragging] = useState(false);
  const trackRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

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

  // Set value based on click/drag position (vertical only, increase from bottom to top)
  const setValue = useCallback(
    (clientY: number, isDragging: boolean) => {
      if (!trackRef.current || disabled) return;

      const rect = trackRef.current.getBoundingClientRect();
      // Vertical direction, increase from bottom to top (inverted calculation)
      let percentage = 1 - (clientY - rect.top) / rect.height;
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
    [min, max, step, disabled, snapToStep, handleChange]
  );

  // Handle track click
  const handleTrackClick = (event: React.MouseEvent) => {
    setValue(event.clientY, false);
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

      let clientY: number;
      if ('touches' in event) {
        clientY = event.touches[0].clientY;
      } else {
        clientY = event.clientY;
      }

      setValue(clientY, true);
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

  return (
    <div className="flex items-center justify-center flex-col flex-1 h-full w-full px-1">
      <div ref={containerRef} className="relative h-full w-full flex flex-col justify-between items-center py-2">
        {/* Top indicator square */}
        <div
          className={cn(
            'w-2 h-2 transition-all duration-200',
            percentage >= 99.5
              ? 'bg-[#FDFB54] shadow-[0_0_0.3em_rgba(253,251,84,0.8)]'
              : 'bg-[#8E8E8E] shadow-[0_0_0.1em_rgba(142,142,142,0.4)]'
          )}
          style={{ flexShrink: 0 }}
        />

        {/* Track area with bars */}
        <div
          ref={trackRef}
          className="relative flex-1 w-full cursor-pointer overflow-hidden my-1"
          onClick={handleTrackClick}
          onMouseDown={startDrag}
          onTouchStart={startDrag}
        >
          {/* Active bars (yellow, full width) - from bottom */}
          <div
            className="absolute bottom-0 left-0 right-0"
            style={{
              height: `${percentage}%`,
              background:
                'repeating-linear-gradient(to top, #FDFB54 0px, #FDFB54 1px, transparent 1px, transparent 2px)',
              filter: 'drop-shadow(0 0 0.2em rgba(253, 251, 84, 0.6))',
            }}
          />

          {/* Inactive bars (gray, 75% width, centered) - from top */}
          <div
            className="absolute top-0 w-2 left-1/2 -translate-x-1/2"
            style={{
              height: `${100 - percentage}%`,
              background:
                'repeating-linear-gradient(to top, #8E8E8E 0px, #8E8E8E 1px, transparent 1px, transparent 2px)',
              filter: 'drop-shadow(0 0 0.05em rgba(142, 142, 142, 0.3))',
            }}
          />
        </div>

        {/* Bottom indicator square */}
        <div
          className={cn(
            'w-2 h-2 transition-all duration-200',
            percentage > 0.5
              ? 'bg-[#FDFB54] shadow-[0_0_0.3em_rgba(253,251,84,0.8)]'
              : 'bg-[#8E8E8E] shadow-[0_0_0.1em_rgba(142,142,142,0.4)]'
          )}
          style={{ flexShrink: 0 }}
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

    return (
      <div
        ref={ref}
        className={cn(
          'flex justify-center items-center select-none flex-col min-h-30 bg-black/60 rounded-full p-1',
          className
        )}
      >
        {/* Increment button */}
        <ZmdRoundIconButton onClick={handleIncrement} disabled={disabled} className={cn('w-5 h-5', buttonClassName)}>
          {incrementIcon || <PlusIcon className="pointer-events-none drop-shadow-[0_0_0.2em_rgba(253,251,84,0.4)]" />}
        </ZmdRoundIconButton>

        <RangeBar
          value={value}
          onChange={handleChange}
          min={min}
          max={max}
          step={step}
          disabled={disabled}
          snapToStep={snapToStep}
        />

        {/* Decrement button */}
        <ZmdRoundIconButton onClick={handleDecrement} disabled={disabled} className={cn('w-5 h-5', buttonClassName)}>
          {decrementIcon || <MinusIcon className="pointer-events-none drop-shadow-[0_0_0.2em_rgba(253,251,84,0.4)]" />}
        </ZmdRoundIconButton>
      </div>
    );
  }
);

RangeInput.displayName = 'RangeInput';
