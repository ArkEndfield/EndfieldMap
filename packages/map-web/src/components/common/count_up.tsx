import { AnimatePresence, motion, MotionValue, useSpring, useTransform } from 'motion/react';
import { useEffect } from 'react';

import { cn } from '@endfieldmap/tools';

interface NumberProps {
  mv: MotionValue<number>;
  number: number;
}

function Number({ mv, number }: NumberProps) {
  const y = useTransform(mv, (latest) => {
    const placeValue = latest % 10;
    const offset = (10 + number - placeValue) % 10;
    let memo = offset;
    if (offset > 5) {
      memo -= 10;
    }
    return `${memo * 100}%`;
  });

  return (
    <motion.span className="absolute inset-0 flex items-center justify-center" style={{ y }}>
      {number}
    </motion.span>
  );
}

interface DigitProps {
  place: number;
  value: number;
  className?: string;
}

function Digit({ place, value, className }: DigitProps) {
  const valueRoundedToPlace = Math.floor(value / place);
  const animatedValue = useSpring(0);

  useEffect(() => {
    animatedValue.set(valueRoundedToPlace);
  }, [animatedValue, valueRoundedToPlace]);

  return (
    <div className={cn('relative h-[1em] w-[1ch] tabular-nums', className)}>
      {Array.from({ length: 10 }, (_, i) => (
        <Number key={i} mv={animatedValue} number={i} />
      ))}
    </div>
  );
}

interface CounterProps {
  value: number;
  className?: string;
  digitClassName?: string;
}

export default function Counter({ value, className, digitClassName }: CounterProps) {
  const valueLength = Math.max(value.toString().length, 1);
  const places = Array.from({ length: valueLength }, (_, i) => Math.pow(10, i)).reverse();

  return (
    <div className={cn('flex overflow-hidden leading-none', className)}>
      <AnimatePresence initial={false} mode="popLayout">
        {places.map((place) => (
          <Digit place={place} value={value} className={digitClassName} />
        ))}
      </AnimatePresence>
    </div>
  );
}
