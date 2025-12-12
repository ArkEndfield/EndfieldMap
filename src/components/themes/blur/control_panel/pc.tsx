import EntityPanel from '@themes/blur/control_panel/controllers/entity_panel';
import { Filters } from '@themes/blur/control_panel/controllers/filters';
import { Operations } from '@themes/blur/control_panel/controllers/operations';
import ToggleButton from '@themes/blur/control_panel/toggle_button';
import { observer } from 'mobx-react-lite';
import { motion } from 'motion/react';
import { useRef } from 'react';

import { ScrollArea } from '@/components/common/scroll_area';
import uiManager from '@/services/ui_manager';
import { cn } from '@/utils/style';

const PCControlPanel = observer(() => {
  const portalRef = useRef<HTMLDivElement>(null);
  const isOpen = uiManager.sidebarCollapsed.value;

  // 检测管理面板是否打开
  const isElectricPoleManagerOpen = uiManager.electricPoleManagerOpen;
  const isCustomPointManagerOpen = uiManager.customPointManagerOpen;
  const isAnyManagerOpen = isElectricPoleManagerOpen || isCustomPointManagerOpen;

  return (
    <motion.div
      initial={{ x: '-100%' }}
      animate={{ x: isOpen ? 0 : '-100%' }}
      transition={{ type: 'spring', bounce: 0.25, duration: 0.4 }}
      className={cn(
        'fixed left-3 top-20 bottom-3 w-86 flex flex-col text-white rounded-2xl',
        'bg-black/40 backdrop-blur-2xl',
        'border border-white/20',
        'shadow-xl shadow-black/20'
      )}
    >
      {/* Toggle button */}
      <ToggleButton
        open={isOpen}
        onToggle={() => (uiManager.sidebarCollapsed.value = !uiManager.sidebarCollapsed.value)}
      />

      {/* Filters and Operations */}
      <div className="px-4 pt-4 shrink-0 grow-0 space-y-3">
        <Filters />
        <Operations portalRef={portalRef} />
      </div>

      {/* Entity Panel */}
      <div className="flex-1 relative overflow-hidden mt-4" ref={portalRef}>
        <ScrollArea className={cn('w-full h-full transition-opacity duration-300', isAnyManagerOpen && 'opacity-0')}>
          <EntityPanel />
        </ScrollArea>
      </div>

      {/* Footer */}
      <div className="shrink-0 grow-0 p-4 text-xs text-center text-white/50">
        <a href="https://beian.miit.gov.cn/" target="_blank" className="hover:text-white/70 transition-colors">
          黑ICP备2025036958号-1
        </a>
      </div>
    </motion.div>
  );
});

export default PCControlPanel;
