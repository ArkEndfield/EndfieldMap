import { motion } from 'motion/react';
import EntityPanel from './controllers/entity_panel';
import { HeaderLogo } from '@/components/common/header_logo';
import { ScrollArea } from '@/components/common/scroll_area';
import { Operations } from './controllers/operations';
import { useRef } from 'react';
import { Filters } from './controllers/filters';
import TitleArrow from './controllers/arrow';
import uiManager from '@/services/ui_manager';
import { observer } from 'mobx-react-lite';

const TopDeco = () => (
  <div
    className="w-full h-6 bg-[#272727] border-r-[0.45em] border-r-[#5a5b5a] shrink-0 grow-0"
    style={{
      clipPath: 'polygon(0% 0%, calc(100% - 1.5em) 0%, 100% 100%, 0% 100%)',
    }}
  ></div>
);

const PCControlPanel = observer(() => {
  const portalRef = useRef<HTMLDivElement>(null);
  const isOpen = uiManager.sidebarCollapsed;

  return (
    <motion.div
      initial={{ x: '-100%' }}
      animate={{ x: isOpen ? 0 : '-100%' }}
      transition={{ type: 'tween', bounce: 0.25, duration: 0.1 }}
      className="fixed left-0 top-14 bottom-0 w-86 flex flex-col text-white"
    >
      <TopDeco />

      <div className="absolute left-0 top-6 z-0">
        <TitleArrow open={isOpen} onToggle={() => uiManager.toggleSidebar()} />
      </div>
      <div className="absolute pl-8 pr-8 shrink-0 grow-0 w-full top-3 z-1">
        <HeaderLogo className="z-1 relative" />
      </div>
      <div className="bg-[#272727] border-r-[0.45em] border-r-[#5a5b5a] flex-1 flex flex-col overflow-y-hidden">
        <div className="px-3 overflow-hidden shrink-0 grow-0 mt-1 space-y-1 pt-28">
          <Filters />
          <Operations portalRef={portalRef} />
        </div>
        <div className="flex-1 relative overflow-hidden" ref={portalRef}>
          <ScrollArea className="w-full h-full">
            <EntityPanel />
          </ScrollArea>
        </div>

        <div className="shrink-0 grow-0 p-2 text-sm text-center text-[#b9b9b9]">
          <a href="https://beian.miit.gov.cn/" target="_blank">
            黑ICP备2025036958号-1
          </a>
        </div>
      </div>
    </motion.div>
  );
})

export default PCControlPanel;