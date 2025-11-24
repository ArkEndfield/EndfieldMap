import { motion } from 'motion/react';
import type { ControlPanelProps } from '../../types/control_panel';
import EntityPanel from './controllers/entity_panel';
import { HeaderLogo } from '@/components/common/header_logo';
import { ScrollArea } from '@/components/common/scroll_area';
import { Operations } from './controllers/operations';
import { useRef } from 'react';
import { Filters } from './controllers/filters';

const TopDeco = () => (
  <div
    className="w-full h-6 bg-[#272727] border-r-[0.45em] border-r-[#5a5b5a] shrink-0 grow-0"
    style={{
      clipPath: 'polygon(0% 0%, calc(100% - 1.5em) 0%, 100% 100%, 0% 100%)',
    }}
  ></div>
);

export default function PCControlPanel({ adapter }: ControlPanelProps) {
  const portalRef = useRef<HTMLDivElement>(null);

  return (
    <motion.div
      initial={{ x: '-100%' }}
      animate={{ x: 0 }}
      transition={{ duration: 0.1, ease: 'easeOut' }}
      className="fixed left-0 top-14 bottom-0 w-86 overflow-hidden flex flex-col text-white"
    >
      <TopDeco />
      <div className="bg-[#272727] border-r-[0.45em] border-r-[#5a5b5a] flex-1 flex flex-col overflow-hidden">
        <div className="pl-8 pr-8 shrink-0 grow-0">
          <HeaderLogo />
        </div>
        <div className='px-3 overflow-hidden shrink-0 grow-0 mt-1 space-y-1'>
          <Filters adapter={adapter} />
          <Operations adapter={adapter} portalRef={portalRef} />
        </div>
        <div className='flex-1 relative overflow-hidden' ref={portalRef}>
          <ScrollArea className="w-full h-full">
            <EntityPanel adapter={adapter} />
          </ScrollArea>
        </div>

        <div className="shrink-0 grow-0 p-2 text-sm text-center text-[#b9b9b9]">
          <a
            href="https://beian.miit.gov.cn/"
            target="_blank"
            >黑ICP备2025036958号-1</a
          >
        </div>
      </div>
    </motion.div>
  );
}
