import { motion } from 'motion/react';
import { cn } from '@endfieldmap/tools';

export const Feedback = ({ hidden }: { hidden?: boolean }) => {
  return (
    <motion.iframe
      initial={false}
      animate={{ opacity: hidden ? 0 : 1 }}
      transition={{ duration: 0.2 }}
      src="https://docs.zmdmap.com/share/shrc22t2uOoeZGKm3eP/view?embed=true"
      className={cn('absolute inset-0 border-0 w-full h-full', hidden && 'pointer-events-none')}
    />
  );
};
