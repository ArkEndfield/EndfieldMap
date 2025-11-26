import { useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import EntityPanel from './controllers/entity_panel';
import { ScrollArea } from '@/components/common/scroll_area';

const FilterControl = () => {
  const [open, setOpen] = useState(false);
  const onOpen = () => setOpen(true);
  const onClose = () => setOpen(false);
  return (
    <>
      <button onClick={onOpen} className="fixed bottom-1">
        展开
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{
              y: '100%',
              opacity: 0,
            }}
            animate={{
              y: 0,
              opacity: 1,
            }}
            exit={{
              y: '100%',
              opacity: 0,
            }}
            transition={{
                duration: 0.1,
                type: 'tween',
            }}
            className="fixed flex flex-col top-0 left-0 right-0 bottom-0 overflow-hidden bg-[#272727]"
          >
            <button onClick={onClose}>关闭</button>
            <ScrollArea className="flex-1 text-white">
              <EntityPanel />
            </ScrollArea>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default function MobileControlPanel() {
  return (
    <>
      <FilterControl />
    </>
  );
}
