import { cn } from '@/utils/style';
import { motion, type HTMLMotionProps } from 'motion/react';

export interface TierTitleProps extends HTMLMotionProps<'button'> {}

// 动画过渡配置
const tierTitleTransition = {
  type: 'spring' as const,
  stiffness: 500,
  damping: 30,
};

export const TierTitle = (props: TierTitleProps) => {
  const { className, animate = { x: 0 }, initial = { x: 50 }, exit = { x: -50 }, ...rest } = props;
  return (
    <motion.button
      initial={initial}
      animate={animate}
      exit={exit}
      transition={tierTitleTransition}
      {...rest}
      className={cn('h-7 bg-black rounded-full flex justify-center items-center w-full', className)}
    />
  );
};
