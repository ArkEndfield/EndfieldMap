import { ScrollArea } from '@endfieldmap/web-components';
import { motion } from 'motion/react';

export const ContentWrapper = ({ children, active }: { children: React.ReactNode; active?: boolean }) =>
  active ? (
    <motion.div
      initial={{ opacity: 0.5 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0.5 }}
      transition={{ duration: 0.3 }}
      className="h-full"
    >
      <ScrollArea className="w-full h-full overflow-hidden">{children}</ScrollArea>
    </motion.div>
  ) : null;
