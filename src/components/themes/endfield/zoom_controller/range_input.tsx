import { forwardRef, useCallback, useEffect, useRef, useState } from 'react';

import { MinusIcon, PlusIcon } from '@/components/common/icons';
import { cn } from '@/utils/style';
import { domEventListener } from '@endfieldmap/tools';

export interface RangeButtonProps {
  disabled?: boolean;
  onClick?: () => void;
  children?: React.ReactNode;
  className?: string;
}

export const RangeButton: React.FC<RangeButtonProps> = ({ disabled = false, onClick, children, className }) => (
  <button className={`inline-block m-2.5 ${className || 'w-4 h-4'}`} onClick={onClick} disabled={disabled}>
    <div
      className={`
          relative bg-[#222122] border-none w-full h-full rotate-45 transition-all duration-300 ease-in-out p-0 outline-none
          drop-shadow-[0_0_0.2em_rgba(253,251,84,0.4)]
          ${!disabled ? 'hover:bg-[#333233] active:bg-[#111011] active:scale-95' : 'opacity-50'}
          ${disabled ? '[&_.button-border]:opacity-30' : ''}
        `}
    >
      {/* Top border */}
      <div className="button-border absolute -top-[0.1em] -left-[0.1em] w-[calc(100%+0.2em)] h-[0.2em] bg-white" />

      {/* Right border */}
      <div className="button-border absolute -top-[0.1em] -right-[0.1em] w-[0.2em] h-[calc(100%+0.2em)] bg-white" />

      {/* Bottom border */}
      <div className="button-border absolute -bottom-[0.1em] -right-[0.1em] w-[calc(100%-0.4em+0.2em)] h-[0.2em] bg-white" />

      {/* Left border */}
      <div className="button-border absolute -top-[0.1em] -left-[0.1em] w-[0.2em] h-[calc(100%+0.2em)] bg-white" />

      {/* Button content */}
      <div className="absolute top-0 left-0 w-full h-full flex justify-center items-center -rotate-45 text-white text-base">
        {children}
      </div>
    </div>
  </button>
);

export interface RangeBarProps {
  value?: number;
  onChange?: (value: number, isDragging?: boolean) => void;
  min?: number;
  max?: number;
  step?: number;
  disabled?: boolean;
  format?: (value: number) => string;
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

  // Update track size in vertical mode
  useEffect(() => {
    if (direction === 'vertical' && containerRef.current && trackRef.current) {
      const updateTrackSize = () => {
        if (!containerRef.current) return;
        const containerHeight = containerRef.current.clientHeight;
        if (containerHeight > 0 && trackRef.current) {
          const trackSize = containerHeight - 24;
          trackRef.current.style.width = `${trackSize}px`;
        }
      };

      updateTrackSize();

      const resizeObserver = new ResizeObserver(updateTrackSize);
      resizeObserver.observe(containerRef.current);
      if (containerRef.current.parentElement) {
        resizeObserver.observe(containerRef.current.parentElement);
      }

      return () => {
        resizeObserver.disconnect();
      };
    }
  }, [direction]);

  const isVertical = direction === 'vertical';

  return (
    <div className={`flex items-center justify-stretch ${isVertical ? 'flex-col h-full' : ''}`}>
      <div className={`flex items-center gap-3 w-full ${isVertical ? 'flex-col h-full' : ''}`}>
        {/* Slider container - rotates 90deg in vertical mode */}
        <div
          ref={containerRef}
          className={`slider-outer-container relative ${isVertical ? 'h-full grow' : 'flex-1 w-full'}`}
          style={isVertical ? { width: '2rem', padding: '10px 0' } : undefined}
        >
          {/* Track and handle - always horizontal layout, rotated in vertical mode */}
          <div
            ref={trackRef}
            className="slider-track-container bg-[#ffff9b6a] shadow-[0_0_0.1em_rgba(253,251,84,0.8)] h-1 relative cursor-pointer w-full"
            style={
              isVertical
                ? {
                    position: 'absolute',
                    top: '50%',
                    left: '50%',
                    transform: 'translate(-50%, -50%) rotate(90deg)',
                    transformOrigin: 'center center',
                  }
                : undefined
            }
            onClick={handleTrackClick}
          >
            {/* Start indicator - inside track so it rotates with it */}
            <div
              className="absolute flex items-center gap-0.5"
              style={{
                left: '-1rem',
                top: '50%',
                transform: isVertical ? 'translateY(-50%) rotate(-90deg)' : 'translateY(-50%) rotate(90deg)',
              }}
            >
              <span className="h-0.5 w-1 bg-white shadow-[0_0_0.2em_rgba(255,255,255,0.8)]"></span>
              <span className="h-1 w-2.5 bg-white shadow-[0_0_0.2em_rgba(255,255,255,0.8)]"></span>
              <span className="h-0.5 w-1 bg-white shadow-[0_0_0.2em_rgba(255,255,255,0.8)]"></span>
            </div>

            {/* End indicator - inside track so it rotates with it */}
            <div
              className="absolute flex items-center gap-0.5"
              style={{
                right: '-1rem',
                top: '50%',
                transform: isVertical ? 'translateY(-50%) rotate(-90deg)' : 'translateY(-50%) rotate(90deg)',
              }}
            >
              <span className="h-0.5 w-1 bg-white shadow-[0_0_0.2em_rgba(255,255,255,0.8)]"></span>
              <span className="h-1 w-2.5 bg-white shadow-[0_0_0.2em_rgba(255,255,255,0.8)]"></span>
              <span className="h-0.5 w-1 bg-white shadow-[0_0_0.2em_rgba(255,255,255,0.8)]"></span>
            </div>
            {/* Fill - always from left in track coordinates */}
            <div
              className="absolute h-full bg-[#FDFB54]"
              style={{
                width: `${percentage > 0 ? percentage : 0}%`,
                left: isVertical ? 'auto' : '0',
                right: isVertical ? '0' : 'auto',
              }}
            ></div>

            {/* Handle - always horizontal positioning in track coordinates */}
            <div
              className={`absolute h-2 w-2 bg-[#FDFB54] shadow-[0_0_0.1em_rgba(253,251,84,0.8)] hover:scale-110 transition-transform -top-0.5 -translate-x-1/2 rotate-45 cursor-grab slider-handle ${
                isDragging ? 'cursor-grabbing scale-110' : ''
              }`}
              style={{
                left: isVertical
                  ? `${percentage > 0 ? 100 - percentage : 100}%`
                  : `${percentage > 0 ? percentage : 0}%`,
              }}
              onMouseDown={startDrag}
              onTouchStart={startDrag}
            >
              {/* Left arrow - positioned relative to the rotated handle */}
              <div
                className="absolute bg-[#fdfb546a] -z-10 pointer-events-none"
                style={{
                  width: '0.5em',
                  height: '1em',
                  left: '0%',
                  top: '-190%',
                  rotate: '225deg',
                  transform: 'translateY(-50%)',
                  clipPath: 'polygon(0 0, 100% 50%, 0 100%, 0 calc(100% - 0.25em), calc(100% - 0.25em) 50%, 0 0.25em)',
                }}
              ></div>
              {/* Right arrow - positioned relative to the rotated handle */}
              <div
                className="absolute bg-[#fdfb546a] -z-10 pointer-events-none"
                style={{
                  width: '0.5em',
                  height: '1em',
                  right: '-140%',
                  top: '-50%',
                  rotate: '225deg',
                  transform: 'translateY(-50%)',
                  clipPath: 'polygon(100% 0, 0 50%, 100% 100%, 100% calc(100% - 0.25em), 0.25em 50%, 100% 0.25em)',
                }}
              ></div>
            </div>
          </div>
        </div>
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
          isVertical ? 'flex-col min-h-30' : 'flex-row-reverse min-w-30',
          className
        )}
      >
        {/* Increment button */}
        <RangeButton onClick={handleIncrement} disabled={disabled} className={buttonClassName}>
          {incrementIcon || (
            <PlusIcon className="pointer-events-none text-4xl drop-shadow-[0_0_0.2em_rgba(253,251,84,0.4)]" />
          )}
        </RangeButton>

        <div className="flex-1 h-full">
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
        <RangeButton onClick={handleDecrement} disabled={disabled} className={buttonClassName}>
          {decrementIcon || (
            <MinusIcon className="pointer-events-none text-4xl drop-shadow-[0_0_0.2em_rgba(253,251,84,0.4)]" />
          )}
        </RangeButton>
      </div>
    );
  }
);

RangeInput.displayName = 'RangeInput';
