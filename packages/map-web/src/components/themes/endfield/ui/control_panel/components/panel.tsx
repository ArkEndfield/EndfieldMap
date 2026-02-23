import { cn } from '@endfieldmap/tools';
import { motion, useAnimation } from 'motion/react';
import { useEffect } from 'react';

export interface PanelProps {
  open: boolean;
  children: React.ReactNode;
}

export const Panel = ({ open, children }: PanelProps) => {
  const controls = useAnimation();

  useEffect(() => {
    controls.start(open ? 'open' : 'closed');
  }, [open, controls]);

  return (
    <motion.div
      className={cn('relative left-0 top-0 overflow-hidden pl-2 pb-2.5 pt-2 col-start-1 row-start-1')}
      initial="closed"
      animate={controls}
      style={{ pointerEvents: open ? 'auto' : 'none' }}
      variants={{
        closed: {
          height: 0,
          transition: {
            type: 'tween',
            ease: 'easeInOut',
            duration: 0.15,
            when: 'afterChildren',
          },
        },
        open: {
          height: 'calc(100vh - 7rem)',
          transition: {
            type: 'tween',
            ease: 'easeInOut',
            duration: 0.15,
            when: 'beforeChildren',
          },
        },
      }}
    >
      <motion.div
        className={cn('bg-[#272727] h-full border-r-4 border-[#3c3c3c] w-76')}
        variants={{
          closed: {
            x: 'calc(-100% - 0.5em)',
            transition: { type: 'tween', ease: 'easeInOut', duration: 0.15 },
          },
          open: {
            x: 0,
            transition: { type: 'tween', ease: 'easeInOut', duration: 0.15 },
          },
        }}
      >
        {children}
      </motion.div>
    </motion.div>
  );
};
